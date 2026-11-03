/** The site's clock: the device's, corrected by synchronizing with a time server. */

import { signal } from '@preact/signals'
import { akamaiSource, type DeviceClock, dateHeaderSource, measure } from '../time/sync.ts'

export type SyncState =
  | { status: 'syncing' }
  | { status: 'synced'; offset: number; uncertainty: number; source: string }
  | { status: 'failed' }

export const syncState = signal<SyncState>({ status: 'syncing' })

/** The corrected time in milliseconds, renewed as each second begins. */
export const now = signal(Date.now())

const resyncAfter = 30 * 60_000

/** The true time minus the device's, as last measured. */
let offset = 0
let lastAttempt = Number.NEGATIVE_INFINITY
let timer: ReturnType<typeof setTimeout> | undefined
/** The device's clock minus the time since the page loaded, which changes only if it jumps. */
let reference = 0
let running: Promise<void> | null = null

const deviceClock: DeviceClock = {
  now: () => Date.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}

export function correctedNow(): number {
  return Date.now() + offset
}

function tick(): void {
  const difference = Date.now() - performance.now()
  if (Math.abs(difference - reference) > 1000) {
    // The device's clock was set, or the device slept: the measured offset no longer holds.
    reference = difference
    offset = 0
    syncState.value = { status: 'syncing' }
    void synchronize()
  }
  now.value = correctedNow()
  clearTimeout(timer)
  timer = setTimeout(tick, 1000 - (correctedNow() % 1000) + 5)
}

/** Measures the device's clock against a time server, unless a measurement is under way. */
export function synchronize(): Promise<void> {
  running ??= run().finally(() => {
    running = null
  })
  return running
}

async function run(): Promise<void> {
  lastAttempt = performance.now()
  if (syncState.value.status === 'failed') syncState.value = { status: 'syncing' }
  const attempts = [
    { source: akamaiSource, samples: 4, precision: 10 },
    // The site's own server, with whole seconds only, where Akamai cannot be reached.
    { source: dateHeaderSource(new URL('/', location.href).href), samples: 10, precision: 50 },
  ]
  for (const { source, samples, precision } of attempts) {
    try {
      const measurement = await measure(source, deviceClock, samples, precision)
      offset = measurement.offset
      syncState.value = { status: 'synced', ...measurement }
      tick()
      return
    } catch (error) {
      console.warn(`Could not read the time from ${source.name}:`, error)
    }
  }
  // A failed resynchronization keeps the last measurement, which drifts only slowly.
  if (syncState.value.status !== 'synced') syncState.value = { status: 'failed' }
}

/** Starts the clock ticking and keeps it synchronized. */
export function startClock(): void {
  reference = Date.now() - performance.now()
  tick()
  void synchronize()
  const resyncIfDue = () => {
    if (!document.hidden && performance.now() - lastAttempt > resyncAfter) void synchronize()
  }
  setInterval(resyncIfDue, 60_000)
  document.addEventListener('visibilitychange', resyncIfDue)
  window.addEventListener('online', () => {
    if (syncState.value.status === 'failed') void synchronize()
  })
}
