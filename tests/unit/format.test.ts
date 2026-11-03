import { describe, expect, it } from 'vitest'
import {
  clockHands,
  dayDifference,
  formatDate,
  formatDuration,
  formatTime,
  isoWeek,
} from '../../src/time/format.ts'

const at = Date.parse('2026-11-03T20:04:08.750Z')

describe('formatTime', () => {
  it('writes a 24-hour clock with seconds', () => {
    expect(formatTime(at, 330, 'en', 'h23', true)).toEqual({ time: '01:34:08', dayPeriod: null })
  })

  it('writes a 12-hour clock with its day period apart', () => {
    expect(formatTime(at, -300, 'en-US', 'h12', true)).toEqual({ time: '3:04:08', dayPeriod: 'PM' })
    expect(formatTime(at, -300, 'en-US', 'h12', false)).toEqual({ time: '3:04', dayPeriod: 'PM' })
  })

  it('never rounds up to the next second', () => {
    expect(formatTime(at, 0, 'en', 'h23', true).time).toBe('20:04:08')
  })
})

describe('formatDate', () => {
  it('writes the date at the offset, which may be a different day', () => {
    expect(formatDate(at, 0, 'en-US')).toBe('Tuesday, November 3, 2026')
    expect(formatDate(at, 9 * 60, 'en-US')).toBe('Wednesday, November 4, 2026')
  })
})

describe('isoWeek', () => {
  it.each([
    ['2026-11-03T12:00:00Z', 45],
    ['2026-01-01T12:00:00Z', 1],
    ['2027-01-01T12:00:00Z', 53],
    ['2024-12-30T12:00:00Z', 1],
    ['2021-01-03T12:00:00Z', 53],
  ])('puts %s in week %i', (iso, week) => {
    expect(isoWeek(Date.parse(iso), 0)).toBe(week)
  })
})

describe('dayDifference', () => {
  it('counts calendar days between two offsets', () => {
    expect(dayDifference(at, 9 * 60, -5 * 60)).toBe(1)
    expect(dayDifference(at, 0, -5 * 60)).toBe(0)
    expect(dayDifference(Date.parse('2026-11-03T02:00:00Z'), -5 * 60, 0)).toBe(-1)
  })
})

describe('formatDuration', () => {
  it.each([
    [330, '5 hours 30 minutes'],
    [-180, '3 hours'],
    [45, '45 minutes'],
    [60, '1 hour'],
    [0, '0 minutes'],
  ])('writes %i minutes as %s', (minutes, text) => {
    expect(formatDuration(minutes, 'en')).toBe(text)
  })
})

describe('clockHands', () => {
  it.each([
    ['2026-11-03T00:00:00Z', 0, 0, 0],
    ['2026-11-03T03:00:00Z', 0, 90, 0],
    ['2026-11-03T21:30:00Z', 0, 285, 180],
    ['2026-11-03T12:15:00Z', 0, 7.5, 90],
    ['2026-11-03T20:00:00Z', -300, 90, 0],
  ])('points at %s, offset %i, to %f and %f degrees', (iso, offset, hour, minute) => {
    expect(clockHands(Date.parse(iso), offset)).toEqual({ hour, minute })
  })
})
