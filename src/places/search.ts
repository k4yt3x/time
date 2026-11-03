/** Suggestions for what someone is typing into the search box. */

import { abbreviations } from '../data/abbreviations.ts'
import { placeKey, placeKeys, prominence } from './places.ts'
import { type Clock, resolve } from './resolve.ts'
import { tzdb } from './tzdb.ts'

/**
 * How well a key matches a query: the whole key, the start of it, the start of a word in it,
 * anywhere in it. Infinity for no match; a one-letter query matches only starts.
 */
function score(key: string, query: string): number {
  if (key === query) return 0
  if (key.startsWith(query)) return 1
  if (key.includes(` ${query}`)) return 2
  if (query.length > 1 && key.includes(query)) return 3
  return Number.POSITIVE_INFINITY
}

interface Candidate {
  token: string
  score: number
  /** Tells apart equal scores, lower first: how likely people mean it, then precedence. */
  rank: number
  order: number
}

/** Up to `limit` clocks for a query, best first. */
export function suggest(query: string, limit = 8): Clock[] {
  const text = query.trim()
  const key = placeKey(text)
  if (text === '') return []
  const candidates: Candidate[] = []
  let order = 0
  const add = (token: string, score: number, rank = Number.POSITIVE_INFINITY) => {
    if (Number.isFinite(score)) candidates.push({ token, score, rank, order: order++ })
  }

  const exact = resolve(text)
  if (exact.ok) add(exact.clock.token, -1)
  for (const abbreviation of abbreviations) {
    add(
      abbreviation.code,
      Math.min(
        score(abbreviation.code.toLowerCase(), text.toLowerCase()),
        score(placeKey(abbreviation.name), key),
      ),
    )
  }
  if (key !== '') {
    for (const [place, keys] of placeKeys()) {
      add(place.slug, Math.min(...keys.map((placeKey) => score(placeKey, key))), prominence(place))
    }
  }
  if (text.includes('/')) {
    const lower = text.toLowerCase()
    for (const name of [...tzdb.zones, ...Object.keys(tzdb.links)]) {
      add(name, score(name.toLowerCase(), lower))
    }
  }

  const clocks: Clock[] = []
  const seen = new Set<string>()
  candidates.sort((a, b) => a.score - b.score || a.rank - b.rank || a.order - b.order)
  for (const candidate of candidates) {
    if (clocks.length === limit) break
    const resolution = resolve(candidate.token)
    if (!resolution.ok || seen.has(resolution.clock.token)) continue
    seen.add(resolution.clock.token)
    clocks.push(resolution.clock)
  }
  return clocks
}
