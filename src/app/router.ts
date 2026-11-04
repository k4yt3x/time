/** The clocks the address names, and moving between sets of clocks. */

import { computed, signal } from '@preact/signals'
import { type Clock, deviceClock, parsePath, pathOf, type Route } from '../places/resolve.ts'

export const route = signal<Route>(parsePath(location.pathname))

/** The clocks shown; the device's own where the address names none. */
export const clocks = computed<Clock[]>(() => {
  const named = route.value.entries.flatMap((entry) => (entry.ok ? [entry.clock] : []))
  return route.value.entries.length === 0 ? [deviceClock()] : named
})

/** Whether the clock shown is the device's own, at the site's root. */
export const showingDevice = computed(() => route.value.entries.length === 0)

/** Writes the address the way this site does, without a new history entry. */
function canonicalize(): void {
  const { canonical } = route.value
  if (canonical !== null && canonical !== location.pathname) {
    history.replaceState(history.state, '', canonical + location.search + location.hash)
  }
}

/** Shows these clocks, in this order; the device's own for none. */
export function show(tokens: readonly string[]): void {
  const path = tokens.length === 0 ? '/' : pathOf(tokens)
  if (path !== location.pathname) history.pushState(null, '', path)
  route.value = parsePath(path)
  window.scrollTo(0, 0)
}

/**
 * Shows the same clocks in another order. The address changes in place: rearranging is not a
 * step to go back through, and the arrow keys would make one of every move.
 */
export function reorder(tokens: readonly string[]): void {
  const path = pathOf(tokens)
  if (path === location.pathname) return
  history.replaceState(history.state, '', path + location.search + location.hash)
  route.value = parsePath(path)
}

/** Adds a clock beside those shown. */
export function add(token: string): void {
  show([...clocks.value.map((clock) => clock.token), token])
}

/** Removes a clock from those shown. */
export function remove(token: string): void {
  show(clocks.value.map((clock) => clock.token).filter((shown) => shown !== token))
}

/** Follows a link to a page of this site without reloading it. */
export function followLink(event: MouseEvent): void {
  const link = event.currentTarget as HTMLAnchorElement
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    link.origin !== location.origin
  ) {
    return
  }
  event.preventDefault()
  const path = link.pathname
  if (path !== location.pathname) history.pushState(null, '', path)
  route.value = parsePath(path)
  canonicalize()
  window.scrollTo(0, 0)
}

export function startRouter(): void {
  canonicalize()
  window.addEventListener('popstate', () => {
    route.value = parsePath(location.pathname)
    canonicalize()
  })
}
