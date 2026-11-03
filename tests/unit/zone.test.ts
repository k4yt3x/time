import { describe, expect, it } from 'vitest'
import { isSupported, nextTransition, offsetAt, zoneName } from '../../src/time/zone.ts'

const at = (iso: string) => Date.parse(iso)

describe('offsetAt', () => {
  it('follows daylight saving time', () => {
    const newYork = { kind: 'iana', id: 'America/New_York' } as const
    expect(offsetAt(newYork, at('2026-07-01T12:00:00Z'))).toBe(-240)
    expect(offsetAt(newYork, at('2026-12-01T12:00:00Z'))).toBe(-300)
  })

  it('reads zones east of UTC with minutes', () => {
    expect(offsetAt({ kind: 'iana', id: 'Asia/Kathmandu' }, at('2026-11-03T00:00:00Z'))).toBe(345)
    expect(offsetAt({ kind: 'iana', id: 'Pacific/Chatham' }, at('2026-12-01T00:00:00Z'))).toBe(825)
  })

  it('changes at the instant of the transition, not the minute before or after', () => {
    const newYork = { kind: 'iana', id: 'America/New_York' } as const
    const change = at('2026-11-01T06:00:00Z')
    expect(offsetAt(newYork, change - 1000)).toBe(-240)
    expect(offsetAt(newYork, change)).toBe(-300)
  })

  it('takes a fixed offset as it is', () => {
    expect(offsetAt({ kind: 'fixed', offset: -720 }, 0)).toBe(-720)
  })
})

describe('nextTransition', () => {
  it('finds the start of daylight saving time to the second', () => {
    const transition = nextTransition(
      { kind: 'iana', id: 'America/New_York' },
      at('2026-11-03T20:00:00Z'),
    )
    expect(transition).toEqual({ at: at('2027-03-14T07:00:00Z'), before: -300, after: -240 })
  })

  it('finds the end of daylight saving time in the southern hemisphere', () => {
    const transition = nextTransition(
      { kind: 'iana', id: 'Australia/Sydney' },
      at('2027-01-01T00:00:00Z'),
    )
    expect(transition).toEqual({ at: at('2027-04-03T16:00:00Z'), before: 660, after: 600 })
  })

  it('finds none where the clocks do not change', () => {
    expect(nextTransition({ kind: 'iana', id: 'Asia/Tokyo' }, at('2026-11-03T00:00:00Z'))).toBe(
      null,
    )
    expect(nextTransition({ kind: 'fixed', offset: 330 }, 0)).toBe(null)
  })
})

describe('zoneName', () => {
  it('names a zone the browser has a name for', () => {
    expect(zoneName('Asia/Tokyo', at('2026-11-03T00:00:00Z'), 'en')).toBe('Japan Standard Time')
    expect(zoneName('America/New_York', at('2026-07-01T00:00:00Z'), 'en-US', 'short')).toBe('EDT')
  })

  it('gives no name where the browser has only an offset', () => {
    expect(zoneName('Asia/Kathmandu', at('2026-07-01T00:00:00Z'), 'en-US', 'short')).toBe(null)
  })
})

describe('isSupported', () => {
  it('tells known zones from unknown ones', () => {
    expect(isSupported('Europe/Kyiv')).toBe(true)
    expect(isSupported('Mars/Olympus_Mons')).toBe(false)
  })
})
