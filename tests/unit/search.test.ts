import { describe, expect, it } from 'vitest'
import { suggest } from '../../src/places/search.ts'

const tokens = (query: string, limit?: number) => suggest(query, limit).map((clock) => clock.token)

describe('suggest', () => {
  it.each([
    ['tok', 'Tokyo'],
    ['Tokyo', 'Tokyo'],
    ['san f', 'San_Francisco'],
    ['new y', 'New_York'],
    ['sao', 'Sao_Paulo'],
    ['est', 'EST'],
    ['utc+5', 'UTC+5'],
    ['utc+5.5', 'UTC+5:30'],
    ['asia/tok', 'Asia/Tokyo'],
    ['japan', 'Japan'],
    ['eastern time', 'ET'],
    ['nyc', 'New_York'],
    ['aus', 'Australia'],
    ['ind', 'India'],
    ['san', 'San_Francisco'],
    ['central', 'CT'],
  ])('puts first for %s: %s', (query, token) => {
    expect(tokens(query)[0]).toBe(token)
  })

  it('finds a word inside a name', () => {
    expect(tokens('francisco')).toContain('San_Francisco')
  })

  it('suggests each clock once, up to the limit', () => {
    const results = tokens('a', 8)
    expect(results.length).toBe(8)
    expect(new Set(results).size).toBe(8)
  })

  it('suggests nothing for nothing', () => {
    expect(suggest('')).toEqual([])
    expect(suggest('   ')).toEqual([])
    expect(tokens('qqqqxz')).toEqual([])
  })
})
