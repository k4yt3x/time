/** Moving one of a list's items to another place in it, as rearranging the clocks shown does. */

/** The items with the one at `from` taken out and put back at `to`. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const moved = [...items]
  const [item] = moved.splice(from, 1)
  if (item !== undefined) moved.splice(to, 0, item)
  return moved
}

/**
 * Where a key moves the item at `index` of `count`: one place earlier or later for the arrows
 * (left and right swapped in a right-to-left layout), to the start for Home and the end for End.
 * The same index where it can go no further; null for a key that moves nothing.
 */
export function keyedMove(key: string, index: number, count: number, rtl = false): number | null {
  const last = count - 1
  switch (key) {
    case 'ArrowUp':
      return Math.max(index - 1, 0)
    case 'ArrowDown':
      return Math.min(index + 1, last)
    case 'ArrowLeft':
      return rtl ? Math.min(index + 1, last) : Math.max(index - 1, 0)
    case 'ArrowRight':
      return rtl ? Math.max(index - 1, 0) : Math.min(index + 1, last)
    case 'Home':
      return 0
    case 'End':
      return last
    default:
      return null
  }
}
