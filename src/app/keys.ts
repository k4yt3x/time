/** Keys pressed for the page itself, rather than for a field or for the browser. */

import { signal } from '@preact/signals'

/** Whether the help is open. */
export const helpOpen = signal(false)

/**
 * The key pressed, if it is for the page: not typed into a field or a dialog, and not with
 * Ctrl, Alt or Cmd, whose combinations are the browser's and the system's. Null otherwise.
 */
export function pageKey(event: KeyboardEvent): string | null {
  if (event.defaultPrevented || event.isComposing) return null
  if (event.ctrlKey || event.metaKey || event.altKey) return null
  const target = event.target
  if (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
      target.closest('dialog') !== null)
  ) {
    return null
  }
  return event.key
}

/** Whether a key starts a search: any character but those kept for shortcuts. */
export function startsSearch(key: string): boolean {
  return key.length === 1 && key !== ' ' && key !== '/' && key !== '?'
}
