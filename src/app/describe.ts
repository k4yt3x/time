/** What a clock is called, and what can be said about it, in the interface's language. */

import { language, locale, messages } from '../i18n/index.ts'
import { cityOfName, englishCountryName, findPlace, prominence } from '../places/places.ts'
import type { Clock } from '../places/resolve.ts'
import { namesInCountry, tzdb, zoneOf } from '../places/tzdb.ts'
import {
  dayDifference,
  formatDate,
  formatDuration,
  formatShortDateTime,
  formatTime,
  formatWeekday,
  type HourCycle,
} from '../time/format.ts'
import { offsetLabel } from '../time/offset.ts'
import { isSupported, offsetAt, type TimeZone, type Transition, zoneName } from '../time/zone.ts'

const regionNames = language === 'en' ? null : new Intl.DisplayNames([locale], { type: 'region' })

export function countryName(country: string): string {
  return regionNames?.of(country) ?? englishCountryName(country)
}

/** The name of a zone at an instant, such as "Japan Standard Time"; null for a fixed offset. */
export function longZoneName(zone: TimeZone, at: number): string | null {
  return zone.kind === 'iana' ? zoneName(zone.id, at, locale) : null
}

export interface Description {
  /** Its name: a city, region or country, an abbreviation, an offset, an IANA name. */
  title: string
  /** The country a city or region is in. */
  country: string | null
  /** What else tells it apart: the name of its zone or abbreviation, or the IANA name typed. */
  detail: string | null
}

export function describeClock(clock: Clock, at: number): Description {
  const { target, zone } = clock
  switch (target.kind) {
    case 'offset':
      return {
        title: offsetLabel(target.offset),
        country: null,
        detail: target.offset === 0 ? messages.coordinatedUniversalTime : null,
      }
    case 'abbreviation':
      return { title: target.abbreviation.code, country: null, detail: target.abbreviation.name }
    case 'place': {
      const { place } = target
      if (place.kind === 'country' && place.country) {
        const name = longZoneName(zone, at)
        // A country with several zones shows one of them; say whose.
        const city = namesInCountry(place.country).length > 1 ? cityOfName(place.zone) : null
        return {
          title: countryName(place.country),
          country: null,
          detail:
            city && name ? messages.zoneOfCity(name, city.name) : (name ?? city?.name ?? null),
        }
      }
      return {
        title: place.name,
        country: place.country ? countryName(place.country) : null,
        detail: null,
      }
    }
    case 'zone': {
      const { place } = target
      if (!place) return { title: target.name, country: null, detail: longZoneName(zone, at) }
      return {
        title: place.name,
        country: place.country ? countryName(place.country) : null,
        detail: target.name,
      }
    }
  }
}

/** A clock's name as a page's heading: "Toronto, Canada". */
export function headingOf({ title, country }: Description): string {
  return country ? messages.placeInCountry(title, country) : title
}

/** The line under a clock's name where it is short of room: "Japan · Asia/Tokyo". */
export function subtitleOf({ country, detail }: Description): string | null {
  return [country, detail].filter(Boolean).join(' · ') || null
}

/** How a zone's time stands to the reader's: ahead, behind or the same. */
export function relation(offset: number, deviceOffset: number): string {
  const difference = offset - deviceOffset
  if (difference === 0) return messages.sameTimeAsYou
  const duration = formatDuration(difference, locale)
  return difference > 0 ? messages.aheadOfYou(duration) : messages.behindYou(duration)
}

/** Writes a list the locale's way: "India and Sri Lanka". */
export function list(
  items: readonly string[],
  type: 'conjunction' | 'disjunction' = 'conjunction',
) {
  return new Intl.ListFormat(locale, { type }).format(items)
}

/** The countries where it is `offset` at the instant `at`, by name. */
export function countriesAt(offset: number, at: number): string[] {
  const countries = new Set<string>()
  for (const [country, name] of tzdb.zoneTab) {
    const id = zoneOf(name)
    if (countries.has(country) || !id || !isSupported(id)) continue
    if (offsetAt({ kind: 'iana', id }, at) === offset) countries.add(country)
  }
  return [...countries].map(countryName).sort((a, b) => a.localeCompare(b, locale))
}

export interface CountryZone {
  /** The clock's URL token. */
  token: string
  name: string
  offset: number
}

const halfYear = 182 * 24 * 60 * 60_000

/**
 * One zone for each different clock a country keeps, west to east: zones are the same clock
 * when they are at the same offsets now and half a year from now. Each clock goes by the
 * country's own zone, `zone`, if it is that clock, else by its best-known city. Empty for a
 * country with one clock.
 */
export function countryClocks(country: string, zone: string, at: number): CountryZone[] {
  const rank = (name: string) => {
    if (zoneOf(name) === zone) return -1
    const city = cityOfName(name)
    return city ? Math.min(prominence(city), Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER
  }
  const clocks = new Map<string, CountryZone>()
  for (const name of namesInCountry(country).sort((a, b) => rank(a) - rank(b))) {
    const id = zoneOf(name)
    if (!id || !isSupported(id)) continue
    const zone: TimeZone = { kind: 'iana', id }
    const offset = offsetAt(zone, at)
    const key = `${offset} ${offsetAt(zone, at + halfYear)}`
    if (clocks.has(key)) continue
    const city = cityOfName(name)
    // The city's own URL, where it leads back to this zone rather than to a namesake.
    const token = city && findPlace(city.slug)?.zone === city.zone ? city.slug : name
    clocks.set(key, { token, name: city?.name ?? name, offset })
  }
  return clocks.size > 1 ? [...clocks.values()].sort((a, b) => a.offset - b.offset) : []
}

const minute = 60_000
const day = 24 * 60 * minute
const week = 7 * day

const dayWords = new Map([
  [-1, messages.yesterday],
  [1, messages.tomorrow],
])

/**
 * The date a clock leads with, such as "Wednesday, November 4, 2026", after "Tomorrow" or
 * "Yesterday" where it is not the reader's date.
 */
export function headlineDate(at: number, offset: number, ownOffset: number): string {
  const date = formatDate(at, offset, locale)
  const word = dayWords.get(dayDifference(at, offset, ownOffset))
  return word ? messages.dayAndDate(word, date) : date
}

/**
 * A change of the clocks within the coming week, by the clock before it changes: "Clocks go back
 * 1 hour on Sunday at 02:00, to UTC−5." Null for one further off, which only the details give.
 */
export function upcomingChange(
  transition: Transition,
  at: number,
  hourCycle: HourCycle,
): string | null {
  if (transition.at - at >= week) return null
  const { before, after } = transition
  const { time, dayPeriod } = formatTime(transition.at, before, locale, hourCycle, false)
  const clock = dayPeriod ? `${time} ${dayPeriod}` : time
  const dayOf = (instant: number) => Math.floor((instant + before * minute) / day)
  const days = dayOf(transition.at) - dayOf(at)
  const when =
    days === 0
      ? messages.todayAt(clock)
      : days === 1
        ? messages.tomorrowAt(clock)
        : messages.onWeekdayAt(formatWeekday(transition.at, before, locale), clock)
  const say = after > before ? messages.clocksGoForward : messages.clocksGoBack
  return say(formatDuration(after - before, locale), when, offsetLabel(after))
}

/**
 * A change of the clocks as the details give it: when, by the clock before it changes ("Sun,
 * Mar 14, 2027, 02:00"), and what it does ("Forward 1 hour, to UTC−4").
 */
export function changeSummary(
  transition: Transition,
  hourCycle: HourCycle,
): { when: string; what: string } {
  const { before, after } = transition
  const say = after > before ? messages.forward : messages.back
  return {
    when: formatShortDateTime(transition.at, before, locale, hourCycle),
    what: say(formatDuration(after - before, locale), offsetLabel(after)),
  }
}
