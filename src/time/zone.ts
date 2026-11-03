/** Time zones, and the offsets they are at, as the browser's time zone database has them. */

import { parseOffset } from './offset.ts'

/** A clock's rules: a fixed offset in minutes east of UTC, or an IANA time zone. */
export type TimeZone = { kind: 'fixed'; offset: number } | { kind: 'iana'; id: string }

const minute = 60_000
const day = 24 * 60 * minute

const fieldFormatters = new Map<string, Intl.DateTimeFormat>()

function fieldFormatter(id: string): Intl.DateTimeFormat {
  let formatter = fieldFormatters.get(id)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: id,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    })
    fieldFormatters.set(id, formatter)
  }
  return formatter
}

/** Whether the browser knows the IANA time zone `id`. */
export function isSupported(id: string): boolean {
  try {
    fieldFormatter(id)
    return true
  } catch {
    return false
  }
}

/** The offset, in minutes east of UTC, that `zone` is at at the instant `at`. */
export function offsetAt(zone: TimeZone, at: number): number {
  if (zone.kind === 'fixed') return zone.offset
  const fields: Partial<Record<Intl.DateTimeFormatPartTypes, number>> = {}
  for (const part of fieldFormatter(zone.id).formatToParts(at)) {
    if (part.type !== 'literal') fields[part.type] = Number(part.value)
  }
  const wall = Date.UTC(
    fields.year ?? 1970,
    (fields.month ?? 1) - 1,
    fields.day ?? 1,
    fields.hour ?? 0,
    fields.minute ?? 0,
    fields.second ?? 0,
  )
  return Math.round((wall - Math.floor(at / 1000) * 1000) / minute)
}

export interface Transition {
  /** The instant the offset changes. */
  at: number
  before: number
  after: number
}

/**
 * The first change of offset after `from` and within `horizon` milliseconds of it, such as
 * the start or end of daylight saving time; null if there is none.
 */
export function nextTransition(
  zone: TimeZone,
  from: number,
  horizon = 400 * day,
): Transition | null {
  if (zone.kind === 'fixed') return null
  const before = offsetAt(zone, from)
  for (let end = from + day; end <= from + horizon; end += day) {
    if (offsetAt(zone, end) === before) continue
    // Offsets change on whole seconds; narrow down to the first one at the new offset.
    let low = Math.floor((end - day) / 1000)
    let high = Math.floor(end / 1000)
    while (high - low > 1) {
      const middle = Math.floor((low + high) / 2)
      if (offsetAt(zone, middle * 1000) === before) low = middle
      else high = middle
    }
    return { at: high * 1000, before, after: offsetAt(zone, high * 1000) }
  }
  return null
}

/**
 * The zone's name at the instant `at` in `locale`, such as "Japan Standard Time" or, with
 * style 'short' in English, "EDT"; null where the browser has only an offset to call it by.
 */
export function zoneName(
  id: string,
  at: number,
  locale: string,
  style: 'long' | 'short' = 'long',
): string | null {
  const key = `${id} ${locale} ${style}`
  let formatter = nameFormatters.get(key)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { timeZone: id, timeZoneName: style })
    nameFormatters.set(key, formatter)
  }
  const name = formatter.formatToParts(at).find((part) => part.type === 'timeZoneName')?.value
  return name && !/^(GMT|UTC)([+\-\u2212]|$)/.test(name) ? name : null
}

const nameFormatters = new Map<string, Intl.DateTimeFormat>()

/** The device's own time zone; UTC if the browser cannot tell. */
export function deviceZone(): TimeZone {
  const id = new Intl.DateTimeFormat().resolvedOptions().timeZone
  // A device set to an offset rather than a place reports it as one, such as "+05:30".
  if (id && /^[+-]/.test(id)) {
    const offset = parseOffset(id)
    if (typeof offset === 'number') return { kind: 'fixed', offset }
  }
  return id && isSupported(id) ? { kind: 'iana', id } : { kind: 'fixed', offset: 0 }
}
