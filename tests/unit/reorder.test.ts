import { describe, expect, it } from 'vitest'
import { keyedMove, moveItem } from '../../src/app/reorder.ts'

describe('moveItem', () => {
  const items = ['a', 'b', 'c', 'd']

  it('moves an item later or earlier', () => {
    expect(moveItem(items, 0, 2)).toEqual(['b', 'c', 'a', 'd'])
    expect(moveItem(items, 3, 0)).toEqual(['d', 'a', 'b', 'c'])
    expect(moveItem(items, 1, 3)).toEqual(['a', 'c', 'd', 'b'])
  })

  it('leaves the list as it was for a move to the same place, and keeps the original', () => {
    expect(moveItem(items, 2, 2)).toEqual(items)
    expect(items).toEqual(['a', 'b', 'c', 'd'])
  })
})

describe('keyedMove', () => {
  it('moves one place with the arrows, no further than the ends', () => {
    expect(keyedMove('ArrowRight', 1, 3)).toBe(2)
    expect(keyedMove('ArrowDown', 1, 3)).toBe(2)
    expect(keyedMove('ArrowLeft', 1, 3)).toBe(0)
    expect(keyedMove('ArrowUp', 1, 3)).toBe(0)
    expect(keyedMove('ArrowLeft', 0, 3)).toBe(0)
    expect(keyedMove('ArrowRight', 2, 3)).toBe(2)
  })

  it('swaps left and right in a right-to-left layout', () => {
    expect(keyedMove('ArrowLeft', 1, 3, true)).toBe(2)
    expect(keyedMove('ArrowRight', 1, 3, true)).toBe(0)
    expect(keyedMove('ArrowDown', 1, 3, true)).toBe(2)
  })

  it('moves to either end with Home and End', () => {
    expect(keyedMove('Home', 2, 3)).toBe(0)
    expect(keyedMove('End', 0, 3)).toBe(2)
  })

  it('moves nothing for other keys', () => {
    expect(keyedMove('Enter', 1, 3)).toBeNull()
    expect(keyedMove('a', 1, 3)).toBeNull()
    expect(keyedMove('toString', 1, 3)).toBeNull()
  })
})
