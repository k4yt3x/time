import { describe, expect, it } from 'vitest'
import { offsetLabel, offsetToken, parseOffset } from '../../src/time/offset.ts'

const h = (hours: number, minutes = 0) => Math.sign(hours || 1) * (Math.abs(hours) * 60 + minutes)

describe('parseOffset', () => {
  it.each([
    ['utc+2', h(2)],
    ['UTC+2', h(2)],
    ['utc+02', h(2)],
    ['utc+5:30', h(5, 30)],
    ['UTC+05:30', h(5, 30)],
    ['utc+0530', h(5, 30)],
    ['utc+530', h(5, 30)],
    ['utc+5.5', h(5, 30)],
    ['utc+5.50', h(5, 30)],
    ['utc+5.75', h(5, 45)],
    ['utc+5.25', h(5, 15)],
    ['utc+5.30', h(5, 30)],
    ['utc+5.45', h(5, 45)],
    ['UTC+8.45', h(8, 45)],
    ['utc-9.5', -h(9, 30)],
    ['utc+12.75', h(12, 45)],
    ['gmt-3', -h(3)],
    ['GMT+5.5', h(5, 30)],
    ['gmt8', h(8)],
    ['utc 2', h(2)],
    ['utc 5:30', h(5, 30)],
    ['utc -3', -h(3)],
    ['UTC\u22123', -h(3)],
    ['+5:30', h(5, 30)],
    ['-03:00', -h(3)],
    ['utc+5:20', h(5, 20)],
    ['utc+14', h(14)],
    ['utc-12', -h(12)],
    ['ut+1', h(1)],
    ['z+2', h(2)],
  ])('reads %s', (text, expected) => {
    expect(parseOffset(text)).toBe(expected)
  })

  it.each(['utc', 'UTC', 'gmt', 'ut', 'z', 'Z', 'zulu', 'utc+0', 'utc-0', 'gmt+00:00'])(
    'reads %s as UTC',
    (text) => {
      expect(parseOffset(text)).toBe(0)
      expect(Object.is(parseOffset(text), -0)).toBe(false)
    },
  )

  it.each([
    'utc+15',
    'utc-13',
    'utc+14:01',
    'utc-12:30',
    'utc+5:60',
    'utc+5.1',
    'utc+5.333',
    'utc+',
    '-',
    'utc+abc',
    'utc+5:30:00',
    'gmt8x',
  ])('rejects %s as an invalid offset', (text) => {
    expect(parseOffset(text)).toBe('invalid')
  })

  it.each(['Tokyo', 'Zurich', 'Utah', 'Utqiagvik', 'Zagreb', 'gmtx', '5', '530', 'EST', ''])(
    'leaves %s to other readers',
    (text) => {
      expect(parseOffset(text)).toBeNull()
    },
  )
})

describe('offsetToken and offsetLabel', () => {
  it.each([
    [0, 'UTC', 'UTC'],
    [h(2), 'UTC+2', 'UTC+2'],
    [h(5, 30), 'UTC+5:30', 'UTC+5:30'],
    [-h(3), 'UTC-3', 'UTC\u22123'],
    [-h(9, 30), 'UTC-9:30', 'UTC\u22129:30'],
    [h(12, 45), 'UTC+12:45', 'UTC+12:45'],
  ])('writes %i minutes as %s', (offset, token, label) => {
    expect(offsetToken(offset)).toBe(token)
    expect(offsetLabel(offset)).toBe(label)
  })

  it('reads back every offset it writes', () => {
    for (let offset = -12 * 60; offset <= 14 * 60; offset++) {
      expect(parseOffset(offsetToken(offset))).toBe(offset)
    }
  })
})
