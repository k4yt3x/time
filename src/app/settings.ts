/** The reader's display choices, kept in the browser between visits. */

import { effect, signal } from '@preact/signals'
import type { HourCycle } from '../time/format.ts'

export interface Settings {
  hourCycle: HourCycle
  seconds: boolean
  /** Whether the details below a single clock are open. */
  details: boolean
}

const storageKey = 'settings'
const defaults: Settings = { hourCycle: 'h23', seconds: true, details: false }

function load(): Settings {
  let stored: unknown
  try {
    stored = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
  } catch (error) {
    console.warn('Could not read the saved settings:', error)
    return defaults
  }
  const value = (stored ?? {}) as Partial<Record<keyof Settings, unknown>>
  return {
    hourCycle:
      value.hourCycle === 'h12' || value.hourCycle === 'h23' ? value.hourCycle : defaults.hourCycle,
    seconds: typeof value.seconds === 'boolean' ? value.seconds : defaults.seconds,
    details: typeof value.details === 'boolean' ? value.details : defaults.details,
  }
}

export const settings = signal<Settings>(load())

effect(() => {
  const value = JSON.stringify(settings.value)
  try {
    localStorage.setItem(storageKey, value)
  } catch (error) {
    console.warn('Could not save the settings:', error)
  }
})
