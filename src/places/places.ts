/** Cities, regions and countries, and the zone each keeps. */

import {
  countryNames,
  countryZones,
  curatedPlaces,
  notPlaces,
  placeAliases,
  prominentPlaces,
  zoneCityNames,
} from '../data/places.ts'
import { countryOf, namesInCountry, tzdb, zoneOf } from './tzdb.ts'

export interface Place {
  /** Its URL. */
  slug: string
  /** Its English name. */
  name: string
  kind: 'city' | 'region' | 'country'
  /** The IANA zone it keeps. */
  zone: string
  /** The IANA name it goes by, which may be a link to `zone`: Oslo's is Europe/Oslo. */
  ianaName: string
  /** ISO 3166 code of its country, or of itself for a country. */
  country: string | null
}

const areas = new Set([
  'Africa',
  'America',
  'Antarctica',
  'Arctic',
  'Asia',
  'Atlantic',
  'Australia',
  'Europe',
  'Indian',
  'Pacific',
])

/** A name reduced to what people type alike: no accents, case, punctuation or underscores. */
export function placeKey(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['\u2019`.]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/** A name as a URL writes it: plain letters, underscores for spaces. */
export function slugOf(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/&/g, 'and')
    .replace(/['\u2019`.,]/g, '')
    .trim()
    .replace(/\s+/g, '_')
}

/** A country's English name. */
export function englishCountryName(country: string): string {
  return (
    countryNames[country] ??
    (tzdb.countries[country] ?? country).replace(/^St /, 'Saint ').replace(/ & /g, ' and ')
  )
}

const cityPlaces = new Map<string, Place | null>()

/** The city a zone or link is named for, such as Tokyo for Asia/Tokyo; null if none. */
export function cityOfName(name: string): Place | null {
  const renamed = tzdb.renames[name]
  if (renamed) return cityOfName(renamed)
  let place = cityPlaces.get(name)
  if (place === undefined) {
    const zone = zoneOf(name)
    const segment = lastSegment(name)
    place =
      zone && isAreaName(name) && !notPlaces.has(name)
        ? {
            slug: segment,
            name: zoneCityNames[segment] ?? segment.replace(/_/g, ' '),
            kind: 'city',
            zone,
            ianaName: name,
            country: countryOf(name) ?? null,
          }
        : null
    cityPlaces.set(name, place)
  }
  return place
}

/** Whether a zone name is a place in an area, such as Europe/Paris, rather than US/Pacific. */
function isAreaName(name: string): boolean {
  const slash = name.indexOf('/')
  return slash > 0 && areas.has(name.slice(0, slash))
}

function lastSegment(name: string): string {
  return name.slice(name.lastIndexOf('/') + 1)
}

interface Index {
  byKey: Map<string, Place>
  /** Every place once, in order of precedence, with all the keys that find it. */
  keys: Map<Place, string[]>
}

let built: Index | undefined

/**
 * Where two places share a name, the first of these to claim it keeps it: the curated places;
 * countries; cities that name a zone today; other names for those; then cities whose zone was
 * merged into another or renamed. So Bahrain is the country, whose zone Asia/Bahrain is, and
 * Samoa is the country rather than Pacific/Samoa, an old name for Pago Pago.
 */
function index(): Index {
  if (built) return built
  const byKey = new Map<string, Place>()
  const keys = new Map<Place, string[]>()
  const add = (text: string, place: Place) => {
    const key = placeKey(text)
    if (key === '' || byKey.has(key)) return
    byKey.set(key, place)
    keys.set(place, [...(keys.get(place) ?? []), key])
  }
  // A place whose URL another place already goes by is that place under other names, such as
  // the city of Asia/Macau and the country Macau: its names find the other.
  const addPlace = (place: Place | null, ...names: string[]) => {
    if (!place) return
    const holder = byKey.get(placeKey(place.slug)) ?? place
    for (const name of [place.name, place.slug, ...names]) add(name, holder)
  }

  for (const place of curatedPlaces) {
    addPlace({
      slug: place.slug ?? slugOf(place.name),
      name: place.name,
      kind: place.kind,
      zone: place.zone,
      ianaName: place.zone,
      country: place.country,
    })
  }
  const countries = new Set(tzdb.zoneTab.map(([country]) => country))
  for (const country of countries) {
    const name = englishCountryName(country)
    const ianaName = countryZones[country] ?? namesInCountry(country)[0] ?? 'Etc/UTC'
    addPlace(
      {
        slug: slugOf(name),
        name,
        kind: 'country',
        zone: zoneOf(ianaName) ?? 'Etc/UTC',
        ianaName,
        country,
      },
      tzdb.countries[country] ?? name,
    )
  }
  for (const [, name] of tzdb.zoneTab) addPlace(cityOfName(name))
  for (const [alias, name] of Object.entries(placeAliases)) {
    const place = byKey.get(placeKey(name))
    if (place) add(alias, place)
  }
  // A renamed city is also found by its old name: Calcutta finds Kolkata.
  for (const name of [...tzdb.zones, ...Object.keys(tzdb.links)]) {
    if (isAreaName(name)) addPlace(cityOfName(name), lastSegment(name))
  }

  built = { byKey, keys }
  return built
}

/** The place a name, slug or other name for it stands for. */
export function findPlace(text: string): Place | undefined {
  const { byKey } = index()
  const key = placeKey(text)
  return (
    byKey.get(key) ??
    byKey.get(key.replace(/^st /, 'saint ')) ??
    byKey.get(key.replace(/^saint /, 'st ')) ??
    (key.endsWith(' city') ? byKey.get(key.slice(0, -' city'.length)) : undefined)
  )
}

/** Every place, in order of precedence, with the keys that find it. */
export function placeKeys(): ReadonlyMap<Place, readonly string[]> {
  return index().keys
}

let ranks: Map<Place, number> | undefined

/** How likely people mean a place, as its position among the prominent ones; else Infinity. */
export function prominence(place: Place): number {
  ranks ??= new Map(
    prominentPlaces.flatMap((name, rank) => {
      const found = findPlace(name)
      return found ? [[found, rank] as const] : []
    }),
  )
  return ranks.get(place) ?? Number.POSITIVE_INFINITY
}
