import { describe, expect, it } from 'vitest'
import { combine, type DeviceClock, measure, type TimeSource } from '../../src/time/sync.ts'

/** A device clock that moves only when something waits on it. */
function simulatedClock(
  start = Date.UTC(2026, 10, 3, 20, 4, 8, 123),
): DeviceClock & { time: number } {
  const clock = {
    time: start,
    now: () => clock.time,
    sleep: async (ms: number) => {
      clock.time += Math.max(0, ms)
    },
  }
  return clock
}

/**
 * A server whose clock is `offset` ahead of the device's, reached in `up` milliseconds and
 * answering in `down`, with the given resolution.
 */
function simulatedServer(
  clock: ReturnType<typeof simulatedClock>,
  offset: number,
  resolution: number,
  up: (i: number) => number,
  down: (i: number) => number,
): TimeSource & { requests: number } {
  const server = {
    name: 'simulated',
    resolution,
    requests: 0,
    async read() {
      const i = server.requests++
      await clock.sleep(up(i))
      const time = Math.floor((clock.time + offset) / resolution) * resolution
      await clock.sleep(down(i))
      return time
    },
  }
  return server
}

describe('combine', () => {
  it('intersects intervals that agree', () => {
    expect(
      combine([
        { low: 0, high: 100 },
        { low: 40, high: 140 },
        { low: 30, high: 90 },
      ]),
    ).toEqual({ low: 40, high: 90 })
  })

  it('falls back on the narrowest interval when they disagree', () => {
    expect(
      combine([
        { low: 0, high: 100 },
        { low: 200, high: 220 },
      ]),
    ).toEqual({ low: 200, high: 220 })
  })
})

describe('measure', () => {
  it('finds the offset from a millisecond source within its uncertainty', async () => {
    const clock = simulatedClock()
    const source = simulatedServer(
      clock,
      1234.5,
      1,
      () => 20,
      () => 20,
    )
    const result = await measure(source, clock, 4, 10)
    expect(Math.abs(result.offset - 1234.5)).toBeLessThanOrEqual(result.uncertainty)
    expect(result.uncertainty).toBeLessThanOrEqual(21)
    expect(result.source).toBe('simulated')
  })

  it('keeps the true offset within its bounds when the way there is slower than back', async () => {
    const clock = simulatedClock()
    const source = simulatedServer(
      clock,
      -5000,
      1,
      () => 90,
      () => 10,
    )
    const result = await measure(source, clock, 4, 10)
    expect(Math.abs(result.offset - -5000)).toBeLessThanOrEqual(result.uncertainty)
  })

  it('narrows a whole-second source down to about the round trip', async () => {
    for (const offset of [0, 1, 499, 500, 999, 2345.678, -760.25]) {
      const clock = simulatedClock()
      const source = simulatedServer(
        clock,
        offset,
        1000,
        () => 15,
        () => 15,
      )
      const result = await measure(source, clock, 10, 50)
      expect(Math.abs(result.offset - offset), `offset ${offset}`).toBeLessThanOrEqual(
        result.uncertainty,
      )
      expect(result.uncertainty, `offset ${offset}`).toBeLessThanOrEqual(25)
      expect(source.requests, `offset ${offset}`).toBeLessThanOrEqual(10)
    }
  })

  it('stays within its bounds when round trips vary', async () => {
    const delays = [120, 15, 60, 30, 200, 20, 45, 25, 80, 10]
    const clock = simulatedClock()
    const source = simulatedServer(
      clock,
      1700,
      1000,
      (i) => delays[i % delays.length] ?? 0,
      (i) => delays[(i + 3) % delays.length] ?? 0,
    )
    const result = await measure(source, clock, 10, 50)
    expect(Math.abs(result.offset - 1700)).toBeLessThanOrEqual(result.uncertainty)
  })

  it('stops once the readings agree closely enough', async () => {
    const clock = simulatedClock()
    const source = simulatedServer(
      clock,
      0,
      1,
      () => 1,
      () => 1,
    )
    await measure(source, clock, 8, 10)
    expect(source.requests).toBe(1)
  })

  it('refuses a time no clock could be showing', async () => {
    const clock = simulatedClock(0)
    const source = simulatedServer(
      clock,
      0,
      1,
      () => 5,
      () => 5,
    )
    await expect(measure(source, clock, 4, 10)).rejects.toThrow(/implausible/)
  })

  it('fails when the source does', async () => {
    const clock = simulatedClock()
    const source: TimeSource = {
      name: 'down',
      resolution: 1,
      read: () => Promise.reject(new Error('offline')),
    }
    await expect(measure(source, clock, 4, 10)).rejects.toThrow('offline')
  })
})
