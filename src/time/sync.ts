/**
 * Measuring how far the device's clock is from a time server's, the way NTP does over HTTP.
 *
 * A server reads its clock at some moment between the device sending a request and receiving
 * the answer, so each reading bounds the difference between the two clocks. The bounds of
 * several readings intersect to a narrower interval, and the estimate is its middle.
 */

import { akamaiTimeUrl } from './servers.ts'

/** Bounds on the true time minus the device's time, in milliseconds. */
export interface Interval {
  low: number
  high: number
}

export interface TimeSource {
  /** Who keeps the time, for people to read, such as "time.akamai.com". */
  name: string
  /** The precision of the server's time in milliseconds: 1, or 1000 for an HTTP Date header. */
  resolution: number
  /** The server's time, truncated to its resolution. */
  read(signal: AbortSignal): Promise<number>
}

/** The device's clock, and waiting by it. Tests substitute a simulated one. */
export interface DeviceClock {
  now(): number
  sleep(ms: number): Promise<void>
}

export interface Measurement {
  /** The true time minus the device's time, in milliseconds. */
  offset: number
  /** How far the true offset may be from `offset`, either way. */
  uncertainty: number
  source: string
}

/** The interval every reading agrees on, or the narrowest reading where they do not all agree. */
export function combine(intervals: readonly Interval[]): Interval {
  const low = Math.max(...intervals.map((interval) => interval.low))
  const high = Math.min(...intervals.map((interval) => interval.high))
  if (low <= high) return { low, high }
  return intervals.reduce((best, interval) =>
    interval.high - interval.low < best.high - best.low ? interval : best,
  )
}

const requestTimeout = 5000
/** Earliest plausible server time: a reading before it is not a clock's. */
const earliest = Date.UTC(2020, 0, 1)
const latest = Date.UTC(2100, 0, 1)

/**
 * Reads `source` up to `samples` times and combines the readings, stopping once they agree to
 * within `precision` milliseconds. For a source that has only whole seconds, each reading
 * after the first is timed to reach the server as its clock turns over to a new second, as
 * best the readings so far tell, so that each one halves what is left of the uncertainty.
 */
export async function measure(
  source: TimeSource,
  clock: DeviceClock,
  samples: number,
  precision: number,
): Promise<Measurement> {
  const intervals: Interval[] = []
  let fastest = Number.POSITIVE_INFINITY
  for (let i = 0; i < samples; i++) {
    if (i > 0 && source.resolution > 1) {
      const { low, high } = combine(intervals)
      const estimate = (low + high) / 2
      const transit = fastest / 2
      const at = clock.now()
      const boundary =
        Math.ceil((at + estimate + transit + 20) / source.resolution) * source.resolution
      await clock.sleep(boundary - estimate - transit - at)
    }
    const sent = clock.now()
    const server = await source.read(AbortSignal.timeout(requestTimeout))
    const received = clock.now()
    if (!Number.isFinite(server) || server < earliest || server > latest) {
      throw new Error(`${source.name} gave an implausible time: ${server}`)
    }
    fastest = Math.min(fastest, received - sent)
    intervals.push({ low: server - received, high: server + source.resolution - sent })
    const { low, high } = combine(intervals)
    if (high - low <= precision) break
  }
  const { low, high } = combine(intervals)
  return { offset: (low + high) / 2, uncertainty: (high - low) / 2, source: source.name }
}

/** Reads a response body of at most `limit` bytes as text. */
async function readText(response: Response, limit: number): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) return ''
  const chunks: Uint8Array[] = []
  let length = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    length += value.length
    if (length > limit) {
      await reader.cancel()
      throw new Error(`The response is longer than ${limit} bytes`)
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }
  return new TextDecoder().decode(bytes)
}

/** Akamai's time service: Unix time with milliseconds, such as "1793737373.131". */
export const akamaiSource: TimeSource = {
  name: new URL(akamaiTimeUrl).host,
  resolution: 1,
  async read(signal) {
    const response = await fetch(akamaiTimeUrl, { cache: 'no-store', signal })
    if (!response.ok) throw new Error(`${akamaiTimeUrl}: HTTP ${response.status}`)
    const text = (await readText(response, 64)).trim()
    if (!/^\d{1,12}(\.\d{1,3})?$/.test(text)) {
      throw new Error(`${akamaiTimeUrl} answered ${JSON.stringify(text)}`)
    }
    return Math.round(Number(text) * 1000)
  },
}

/** The Date header of the site's own server, which has whole seconds only. */
export function dateHeaderSource(url: string): TimeSource {
  return {
    name: new URL(url).host,
    resolution: 1000,
    async read(signal) {
      const response = await fetch(url, { method: 'HEAD', cache: 'no-store', signal })
      const date = response.headers.get('Date')
      const time = date === null ? Number.NaN : Date.parse(date)
      if (Number.isNaN(time)) throw new Error(`${url} sent no usable Date header`)
      return time
    },
  }
}
