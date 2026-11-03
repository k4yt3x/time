/** The names, links and countries of the IANA time zone database (src/data/tzdb.json). */

import data from '../data/tzdb.json'
import { isSupported } from '../time/zone.ts'

export interface Tzdb {
  version: string
  /** Primary zone names. */
  zones: string[]
  /** Other names, to the zone each stands for. */
  links: Record<string, string>
  /** Old names of places, to their current name. */
  renames: Record<string, string>
  /** Each zone, or the link standing for it, with its country and a note on where it applies. */
  zoneTab: [country: string, zone: string, comment: string][]
  /** Country names by ISO 3166 code, as the database writes them. */
  countries: Record<string, string>
}

export const tzdb: Tzdb = {
  ...data,
  zoneTab: data.zoneTab.map(([country = '', zone = '', comment = '']) => [country, zone, comment]),
}

const zones = new Set(tzdb.zones)
const spellings = new Map(
  [...tzdb.zones, ...Object.keys(tzdb.links)].map((name) => [name.toLowerCase(), name]),
)
const countryOfName = new Map(tzdb.zoneTab.map(([country, name]) => [name, country]))

/** The zone a name stands for: itself if it is one, else its link's; undefined if neither. */
export function zoneOf(name: string): string | undefined {
  return zones.has(name) ? name : tzdb.links[name]
}

/** A zone or link name as the database spells it, typed in any case and with spaces. */
export function spellName(text: string): string | undefined {
  return spellings.get(text.trim().replace(/\s+/g, '_').toLowerCase())
}

/** The country of a zone or link: its own in zone.tab, else that of the zone it links to. */
export function countryOf(name: string): string | undefined {
  const zone = zoneOf(name)
  return countryOfName.get(name) ?? (zone === undefined ? undefined : countryOfName.get(zone))
}

/** The zone.tab names of a country's zones, in the database's order. */
export function namesInCountry(country: string): string[] {
  return tzdb.zoneTab.filter(([code]) => code === country).map(([, name]) => name)
}

/**
 * The name the browser knows a zone by. Browsers update their database with their releases,
 * so an older one may know a renamed place only by its old name (Europe/Kiev for Europe/Kyiv).
 * Undefined if the browser knows it by no name.
 */
export function browserName(zone: string): string | undefined {
  const names = [
    zone,
    ...Object.entries(tzdb.renames)
      .filter(([, current]) => zoneOf(current) === zone || current === zone)
      .map(([old]) => old),
    ...Object.entries(tzdb.links)
      .filter(([, target]) => target === zone)
      .map(([link]) => link),
  ]
  return names.find(isSupported)
}
