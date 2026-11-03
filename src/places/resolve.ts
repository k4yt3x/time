/** What the text of a URL or the search box names: a clock, or nothing this site knows. */

import { type Abbreviation, abbreviations } from '../data/abbreviations.ts'
import { offsetToken, parseOffset } from '../time/offset.ts'
import { deviceZone, type TimeZone } from '../time/zone.ts'
import { cityOfName, findPlace, type Place } from './places.ts'
import { browserName, spellName, tzdb, zoneOf } from './tzdb.ts'

export type Target =
  | { kind: 'offset'; offset: number }
  | { kind: 'abbreviation'; abbreviation: Abbreviation }
  | { kind: 'place'; place: Place }
  /** An IANA name, and the city it is named for if any. */
  | { kind: 'zone'; name: string; place: Place | null }

export interface Clock {
  /** How the URL writes it. */
  token: string
  target: Target
  /** The rules its time follows. */
  zone: TimeZone
}

export type Problem =
  /** Nothing by that name. */
  | 'unknown'
  /** An offset no clock can show, such as UTC+15. */
  | 'invalid-offset'
  /** A zone the browser's own time zone database does not have yet. */
  | 'unsupported'

export type Resolution = { ok: true; clock: Clock } | { ok: false; input: string; problem: Problem }

const abbreviationsByCode = new Map(
  abbreviations.flatMap((abbreviation) =>
    [abbreviation.code, ...(abbreviation.aliases ?? [])].map((code) => [
      code.toLowerCase(),
      abbreviation,
    ]),
  ),
)

/**
 * What a piece of text names. In order: a UTC offset (UTC+5:30), a time zone abbreviation
 * (EST), a place (Tokyo, Japan, California), an IANA time zone name (Asia/Tokyo).
 */
export function resolve(input: string): Resolution {
  const text = input.trim()
  const failure = (problem: Problem): Resolution => ({ ok: false, input, problem })
  if (text === '') return failure('unknown')

  const offset = parseOffset(text)
  if (offset === 'invalid') return failure('invalid-offset')
  if (offset !== null) return offsetClock(offset)

  const abbreviation = abbreviationsByCode.get(text.toLowerCase())
  if (abbreviation) {
    const zone =
      abbreviation.zone.kind === 'iana' ? ianaZone(abbreviation.zone.id) : abbreviation.zone
    return zone
      ? {
          ok: true,
          clock: { token: abbreviation.code, target: { kind: 'abbreviation', abbreviation }, zone },
        }
      : failure('unsupported')
  }

  const place = findPlace(text)
  if (place) {
    const zone = ianaZone(place.zone)
    return zone
      ? { ok: true, clock: { token: place.slug, target: { kind: 'place', place }, zone } }
      : failure('unsupported')
  }

  const spelled = spellName(text)
  if (spelled) {
    const name = tzdb.renames[spelled] ?? spelled
    const zone = zoneOf(name) ?? name
    // Etc/GMT+3 is UTC-3: POSIX counts offsets west of Greenwich as positive.
    const etc = /^Etc\/GMT([+-]\d+)$/.exec(zone)
    if (etc) return offsetClock(-Number(etc[1]) * 60)
    if (zone === 'Etc/UTC' || zone === 'Etc/GMT') return offsetClock(0)
    const browserZone = ianaZone(zone)
    return browserZone
      ? {
          ok: true,
          clock: {
            token: name,
            target: { kind: 'zone', name, place: cityOfName(name) },
            zone: browserZone,
          },
        }
      : failure('unsupported')
  }

  return failure('unknown')
}

function offsetClock(offset: number): Resolution {
  return {
    ok: true,
    clock: {
      token: offsetToken(offset),
      target: { kind: 'offset', offset },
      zone: { kind: 'fixed', offset },
    },
  }
}

function ianaZone(zone: string): TimeZone | null {
  const id = browserName(zone)
  return id ? { kind: 'iana', id } : null
}

/** The device's own clock, as the place its zone is named for where there is one. */
export function deviceClock(): Clock {
  const zone = deviceZone()
  if (zone.kind === 'fixed') {
    return {
      token: offsetToken(zone.offset),
      target: { kind: 'offset', offset: zone.offset },
      zone,
    }
  }
  const name = tzdb.renames[zone.id] ?? zone.id
  const place = cityOfName(name)
  return place
    ? { token: place.slug, target: { kind: 'place', place }, zone }
    : { token: name, target: { kind: 'zone', name, place: null }, zone }
}

export interface Route {
  /** What each part of the path names, in order; none for the device's own clock. */
  entries: Resolution[]
  /** The path naming the same clocks as this site writes it; null if any part names none. */
  canonical: string | null
}

/**
 * Reads a URL path: clocks separated by commas, such as /UTC+5:30,Tokyo,America/New_York.
 * A clock named twice is shown once.
 */
export function parsePath(pathname: string): Route {
  let path = pathname
  try {
    path = decodeURIComponent(pathname)
  } catch {
    // A malformed escape stays as typed and names nothing.
  }
  path = path.replace(/^\/+|\/+$/g, '')
  if (path === '' || path === 'index.html' || path === 'index')
    return { entries: [], canonical: '/' }
  const entries = path
    .split(',')
    .map((part) => part.trim().replace(/^\/+|\/+$/g, ''))
    .filter((part) => part !== '')
    .map(resolve)
  const tokens = entries.map((entry) => (entry.ok ? entry.clock.token : null))
  return {
    entries: entries.filter((entry, i) => !entry.ok || tokens.indexOf(entry.clock.token) === i),
    canonical: tokens.every((token) => token !== null) ? pathOf(tokens) : null,
  }
}

/** The path showing these clocks, in this order. */
export function pathOf(tokens: readonly string[]): string {
  return `/${[...new Set(tokens)].join(',')}`
}
