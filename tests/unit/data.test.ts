/** The hand-written data agrees with the time zone database and with itself. */

import { describe, expect, it } from 'vitest'
import { abbreviations } from '../../src/data/abbreviations.ts'
import {
  countryZones,
  curatedPlaces,
  placeAliases,
  prominentPlaces,
} from '../../src/data/places.ts'
import { findPlace, placeKeys } from '../../src/places/places.ts'
import { resolve } from '../../src/places/resolve.ts'
import { namesInCountry, tzdb, zoneOf } from '../../src/places/tzdb.ts'

describe('curated data', () => {
  it('names only zones the database has', () => {
    const zones = [
      ...curatedPlaces.map((place) => place.zone),
      ...Object.values(countryZones),
      ...abbreviations.flatMap((abbreviation) =>
        abbreviation.zone.kind === 'iana' ? [abbreviation.zone.id] : [],
      ),
    ]
    for (const zone of zones) expect(zoneOf(zone), zone).toBeDefined()
  })

  it('puts curated places in countries the database has', () => {
    for (const place of curatedPlaces)
      expect(tzdb.countries, place.name).toHaveProperty(place.country)
  })

  it("picks each country's zone from its own", () => {
    for (const [country, zone] of Object.entries(countryZones)) {
      expect(namesInCountry(country), country).toContain(zone)
    }
  })

  it('leads every alias to a place', () => {
    for (const [alias, name] of Object.entries(placeAliases)) {
      const resolution = resolve(alias)
      expect(resolution.ok && resolution.clock.target.kind, alias).toBe('place')
      expect(resolution).toEqual(resolve(name))
    }
  })

  it('finds every prominent place, once', () => {
    const found = prominentPlaces.map((name) => findPlace(name))
    expect(prominentPlaces.filter((_, i) => !found[i])).toEqual([])
    expect(new Set(found).size).toBe(prominentPlaces.length)
  })

  it('leads every related clock somewhere', () => {
    for (const abbreviation of abbreviations) {
      if (abbreviation.related)
        expect(resolve(abbreviation.related).ok, abbreviation.code).toBe(true)
    }
  })
})

describe('tokens', () => {
  it('lead every place back to itself', () => {
    for (const place of placeKeys().keys()) {
      const resolution = resolve(place.slug)
      expect(resolution.ok && resolution.clock.target, place.slug).toEqual({
        kind: 'place',
        place,
      })
    }
  })

  it('lead every abbreviation back to itself', () => {
    for (const abbreviation of abbreviations) {
      const resolution = resolve(abbreviation.code)
      expect(resolution.ok && resolution.clock.target, abbreviation.code).toEqual({
        kind: 'abbreviation',
        abbreviation,
      })
    }
  })

  it('give every country with a zone a place', () => {
    const countries = new Set(tzdb.zoneTab.map(([country]) => country))
    const placed = new Set(
      [...placeKeys().keys()]
        .filter((place) => place.kind === 'country')
        .map((place) => place.country),
    )
    expect([...countries].filter((country) => !placed.has(country))).toEqual([])
  })
})
