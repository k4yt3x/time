import { describe, expect, it } from 'vitest'
import { type Clock, parsePath, resolve } from '../../src/places/resolve.ts'

function clock(text: string): Clock {
  const resolution = resolve(text)
  if (!resolution.ok) throw new Error(`${text}: ${resolution.problem}`)
  return resolution.clock
}

describe('resolve', () => {
  it.each([
    ['utc+2', 'UTC+2'],
    ['utc+5:30', 'UTC+5:30'],
    ['utc+5.5', 'UTC+5:30'],
    ['gmt-3', 'UTC-3'],
    ['UTC', 'UTC'],
    ['z', 'UTC'],
    ['Etc/GMT+3', 'UTC-3'],
    ['Etc/GMT-14', 'UTC+14'],
    ['etc/utc', 'UTC'],
    ['Etc/Universal', 'UTC'],
  ])('reads %s as the offset %s', (text, token) => {
    const { target, token: actual, zone } = clock(text)
    expect(actual).toBe(token)
    expect(target.kind).toBe('offset')
    expect(zone.kind).toBe('fixed')
  })

  it.each([
    ['est', 'EST', { kind: 'fixed', offset: -300 }],
    ['ET', 'ET', { kind: 'iana', id: 'America/New_York' }],
    ['aoe', 'AoE', { kind: 'fixed', offset: -720 }],
    ['chst', 'ChST', { kind: 'fixed', offset: 600 }],
    ['PHST', 'PHT', { kind: 'fixed', offset: 480 }],
  ])('reads %s as the abbreviation %s', (text, token, zone) => {
    expect(clock(text)).toMatchObject({ token, target: { kind: 'abbreviation' }, zone })
  })

  it.each([
    ['tokyo', 'Tokyo', 'Asia/Tokyo', 'JP'],
    ['new york', 'New_York', 'America/New_York', 'US'],
    ['New_York', 'New_York', 'America/New_York', 'US'],
    ['NYC', 'New_York', 'America/New_York', 'US'],
    ['São Paulo', 'Sao_Paulo', 'America/Sao_Paulo', 'BR'],
    ['sao paulo', 'Sao_Paulo', 'America/Sao_Paulo', 'BR'],
    ["St. John's", 'St_Johns', 'America/St_Johns', 'CA'],
    ['calcutta', 'Kolkata', 'Asia/Kolkata', 'IN'],
    ['Kiev', 'Kyiv', 'Europe/Kyiv', 'UA'],
    ['Montreal', 'Montreal', 'America/Toronto', 'CA'],
    ['Oslo', 'Oslo', 'Europe/Berlin', 'NO'],
    ['san francisco', 'San_Francisco', 'America/Los_Angeles', 'US'],
    ['Washington', 'Washington', 'America/New_York', 'US'],
    ['washington dc', 'Washington', 'America/New_York', 'US'],
    ['st louis', 'Saint_Louis', 'America/Chicago', 'US'],
    ['Saint Petersburg', 'Saint_Petersburg', 'Europe/Moscow', 'RU'],
    ['mexico city', 'Mexico_City', 'America/Mexico_City', 'MX'],
    ['Tokyo City', 'Tokyo', 'Asia/Tokyo', 'JP'],
    ['california', 'California', 'America/Los_Angeles', 'US'],
    ['japan', 'Japan', 'Asia/Tokyo', 'JP'],
    ['USA', 'United_States', 'America/New_York', 'US'],
    ['uk', 'United_Kingdom', 'Europe/London', 'GB'],
    ['Australia', 'Australia', 'Australia/Sydney', 'AU'],
    ['russia', 'Russia', 'Europe/Moscow', 'RU'],
    ['Samoa', 'Samoa', 'Pacific/Apia', 'WS'],
    ['bosnia and herzegovina', 'Bosnia_and_Herzegovina', 'Europe/Belgrade', 'BA'],
    ['Bosnia & Herzegovina', 'Bosnia_and_Herzegovina', 'Europe/Belgrade', 'BA'],
  ])('reads %s as the place %s', (text, token, zone, country) => {
    expect(clock(text)).toMatchObject({
      token,
      target: { kind: 'place', place: { zone, country } },
      zone: { kind: 'iana', id: zone },
    })
  })

  it.each([
    ['asia/tokyo', 'Asia/Tokyo', 'Asia/Tokyo'],
    ['America/New York', 'America/New_York', 'America/New_York'],
    [
      'America/Argentina/Buenos_Aires',
      'America/Argentina/Buenos_Aires',
      'America/Argentina/Buenos_Aires',
    ],
    ['Asia/Calcutta', 'Asia/Kolkata', 'Asia/Kolkata'],
    ['US/Eastern', 'US/Eastern', 'America/New_York'],
    ['Europe/Oslo', 'Europe/Oslo', 'Europe/Berlin'],
  ])('reads %s as the zone %s', (text, token, id) => {
    expect(clock(text)).toMatchObject({
      token,
      target: { kind: 'zone', name: token },
      zone: { kind: 'iana', id },
    })
  })

  it('names the city of a zone that has one', () => {
    const { target } = clock('Asia/Tokyo')
    expect(target.kind === 'zone' && target.place?.name).toBe('Tokyo')
    const legacy = clock('US/Eastern').target
    expect(legacy.kind === 'zone' && legacy.place).toBe(null)
  })

  it.each([
    ['utc+15', 'invalid-offset'],
    ['UTC-13', 'invalid-offset'],
    ['utc+5:60', 'invalid-offset'],
    ['Atlantis', 'unknown'],
    ['Mars/Olympus_Mons', 'unknown'],
    ['', 'unknown'],
    ['  ', 'unknown'],
  ])('finds nothing for %s', (text, problem) => {
    expect(resolve(text)).toEqual({ ok: false, input: text, problem })
  })
})

describe('parsePath', () => {
  const canonical = (path: string) => parsePath(path).canonical

  it.each(['/', '', '/index.html', '/index', '//'])('reads %s as the device clock', (path) => {
    expect(parsePath(path)).toEqual({ entries: [], canonical: '/' })
  })

  it.each([
    ['/utc+2', '/UTC+2'],
    ['/utc+5:30', '/UTC+5:30'],
    ['/utc+5.5', '/UTC+5:30'],
    ['/gmt-3', '/UTC-3'],
    ['/utc%202', '/UTC+2'],
    ['/UTC%E2%88%923', '/UTC-3'],
    ['/UTC+2/', '/UTC+2'],
    ['/new%20york', '/New_York'],
    ['/S%C3%A3o_Paulo', '/Sao_Paulo'],
    ['/asia/tokyo', '/Asia/Tokyo'],
    ['/Tokyo,utc,london', '/Tokyo,UTC,London'],
    ['/Asia/Tokyo,America/New_York', '/Asia/Tokyo,America/New_York'],
    ['/Tokyo,utc,Tokyo,tokyo', '/Tokyo,UTC'],
    ['/est,ET', '/EST,ET'],
  ])('writes %s as %s', (path, expected) => {
    expect(canonical(path)).toBe(expected)
  })

  it('keeps every clock it can read and says which parts it could not', () => {
    const route = parsePath('/Tokyo,Atlantis,utc+15')
    expect(route.canonical).toBe(null)
    expect(route.entries.map((entry) => (entry.ok ? entry.clock.token : entry.problem))).toEqual([
      'Tokyo',
      'unknown',
      'invalid-offset',
    ])
  })

  it('names nothing for a malformed escape', () => {
    expect(parsePath('/%E0%A4%A').entries).toEqual([
      { ok: false, input: '%E0%A4%A', problem: 'unknown' },
    ])
  })

  it('reads back every path it writes', () => {
    for (const path of ['/UTC+5:30,UTC-9:30', '/Saint_Louis,Sao_Paulo', '/AoE,ChST,US/Eastern']) {
      expect(canonical(path)).toBe(path)
    }
  })
})
