import { describe, expect, it } from 'vitest'
import {
  changeSummary,
  countriesAt,
  countryClocks,
  describeClock,
  headingOf,
  headlineDate,
  subtitleOf,
  upcomingChange,
} from '../../src/app/describe.ts'
import { type Clock, resolve } from '../../src/places/resolve.ts'
import type { HourCycle } from '../../src/time/format.ts'
import { nextTransition } from '../../src/time/zone.ts'

const at = Date.parse('2026-11-03T20:00:00Z')

function clock(text: string): Clock {
  const resolution = resolve(text)
  if (!resolution.ok) throw new Error(`${text}: ${resolution.problem}`)
  return resolution.clock
}

describe('countryClocks', () => {
  it('names each clock of a country by its best-known city, west to east', () => {
    expect(countryClocks('AU', 'Australia/Sydney', at).map((zone) => zone.name)).toEqual([
      'Perth',
      'Eucla',
      'Darwin',
      'Brisbane',
      'Adelaide',
      'Sydney',
      'Lord Howe',
    ])
    expect(countryClocks('US', 'America/New_York', at).map((zone) => zone.token)).toEqual([
      'Honolulu',
      'Adak',
      'Anchorage',
      'Los_Angeles',
      'Denver',
      'Phoenix',
      'Chicago',
      'New_York',
    ])
  })

  it('lists nothing for a country with one clock', () => {
    expect(countryClocks('JP', 'Asia/Tokyo', at)).toEqual([])
  })
})

describe('countriesAt', () => {
  it('names the countries at an offset now', () => {
    expect(countriesAt(330, at)).toEqual(['India', 'Sri Lanka'])
    expect(countriesAt(90, at)).toEqual([])
  })
})

describe('describeClock', () => {
  it.each([
    // What to show; its heading on its own page; the line under that; its subtitle in a list.
    ['UTC+5:30', 'UTC+5:30', null, null],
    ['UTC', 'UTC', 'Coordinated Universal Time', 'Coordinated Universal Time'],
    ['EST', 'EST', 'Eastern Standard Time', 'Eastern Standard Time'],
    ['Tokyo', 'Tokyo, Japan', null, 'Japan'],
    ['California', 'California, United States', null, 'United States'],
    ['Asia/Tokyo', 'Tokyo, Japan', 'Asia/Tokyo', 'Japan · Asia/Tokyo'],
    ['Japan', 'Japan', 'Japan Standard Time', 'Japan Standard Time'],
    [
      'USA',
      'United States',
      'Eastern Standard Time (New York)',
      'Eastern Standard Time (New York)',
    ],
    ['US/Eastern', 'US/Eastern', 'Eastern Standard Time', 'Eastern Standard Time'],
  ])('heads %s "%s"', (text, heading, detail, subtitle) => {
    const description = describeClock(clock(text), at)
    expect(headingOf(description)).toBe(heading)
    expect(description.detail).toBe(detail)
    expect(subtitleOf(description)).toBe(subtitle)
  })
})

describe('headlineDate', () => {
  it('leads with the day where it is not the reader’s', () => {
    expect(headlineDate(at, 9 * 60, -5 * 60)).toBe('Tomorrow, Wednesday, November 4, 2026')
    expect(headlineDate(at, 2 * 60, -5 * 60)).toBe('Tuesday, November 3, 2026')
    expect(headlineDate(Date.parse('2026-11-03T02:00:00Z'), -8 * 60, 0)).toBe(
      'Yesterday, Monday, November 2, 2026',
    )
  })
})

describe('changes of the clocks', () => {
  function transitionAfter(from: number) {
    const transition = nextTransition({ kind: 'iana', id: 'America/New_York' }, from)
    if (!transition) throw new Error(`No change after ${from}`)
    return transition
  }
  function upcoming(from: string, hourCycle: HourCycle = 'h23') {
    const instant = Date.parse(from)
    return upcomingChange(transitionAfter(instant), instant, hourCycle)
  }

  it('leave a change more than a week away to the details', () => {
    const from = Date.parse('2026-11-03T20:00:00Z')
    const transition = transitionAfter(from)
    expect(upcomingChange(transition, from, 'h23')).toBe(null)
    expect(changeSummary(transition, 'h23')).toEqual({
      when: 'Sun, Mar 14, 2027, 02:00',
      what: 'Forward 1 hour, to UTC\u22124',
    })
    expect(changeSummary(transition, 'h12').when).toBe('Sun, Mar 14, 2027, 2:00 AM')
  })

  it('name the day of a change within the week, by the clock before it', () => {
    expect(upcoming('2026-10-29T12:00:00Z')).toBe(
      'Clocks go back 1 hour on Sunday at 02:00, to UTC\u22125.',
    )
    expect(upcoming('2026-11-01T01:00:00Z')).toBe(
      'Clocks go back 1 hour tomorrow at 02:00, to UTC\u22125.',
    )
    expect(upcoming('2026-11-01T05:00:00Z')).toBe(
      'Clocks go back 1 hour today at 02:00, to UTC\u22125.',
    )
    expect(upcoming('2026-10-29T12:00:00Z', 'h12')).toBe(
      'Clocks go back 1 hour on Sunday at 2:00 AM, to UTC\u22125.',
    )
  })
})
