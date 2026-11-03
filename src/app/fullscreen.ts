/** Showing the clocks on the whole screen. */

import { signal } from '@preact/signals'

export const fullscreen = signal(false)

/** Whether the browser lets the page fill the screen; iPhones, for one, do not. */
export const canFullscreen = typeof document !== 'undefined' && document.fullscreenEnabled

export function toggleFullscreen(): void {
  const request = document.fullscreenElement
    ? document.exitFullscreen()
    : document.documentElement.requestFullscreen()
  request.catch((error: unknown) => console.warn('Could not change full screen:', error))
}

export function startFullscreen(): void {
  document.addEventListener('fullscreenchange', () => {
    fullscreen.value = document.fullscreenElement !== null
  })
}
