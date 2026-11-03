import { useSignalEffect } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { now } from '../app/clock.ts'
import { describeClock } from '../app/describe.ts'
import { fullscreen } from '../app/fullscreen.ts'
import { helpOpen, pageKey } from '../app/keys.ts'
import { clocks, route, show, showingDevice } from '../app/router.ts'
import { settings } from '../app/settings.ts'
import { locale, messages } from '../i18n/index.ts'
import { formatTime } from '../time/format.ts'
import { offsetAt } from '../time/zone.ts'
import { ClockGrid } from './ClockGrid.tsx'
import { ClockNotice } from './ClockStatus.tsx'
import { Footer } from './Footer.tsx'
import { Header } from './Header.tsx'
import { Help } from './Help.tsx'
import { type Failure, NotFound, ProblemNotice } from './Problems.tsx'
import { SingleClock } from './SingleClock.tsx'

/** The tab's title: the time itself for one clock, so it can be read from the tab. */
function pageTitle(): string {
  const shown = clocks.value
  const at = now.value
  const [first] = shown
  if (shown.length === 1 && first) {
    const offset = offsetAt(first.zone, at)
    const { time, dayPeriod } = formatTime(
      at,
      offset,
      locale,
      settings.value.hourCycle,
      settings.value.seconds,
    )
    return `${dayPeriod ? `${time} ${dayPeriod}` : time} · ${describeClock(first, at).title}`
  }
  if (shown.length > 1) {
    return `${shown.map((clock) => describeClock(clock, at).title).join(', ')} · ${messages.siteName}`
  }
  return messages.siteName
}

export function App() {
  const shown = clocks.value
  const failures: Failure[] = route.value.entries.flatMap((entry) =>
    entry.ok ? [] : [{ input: entry.input, problem: entry.problem }],
  )
  const [first] = shown

  useSignalEffect(() => {
    document.title = pageTitle()
  })

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      const key = pageKey(event)
      if (key === '?') {
        event.preventDefault()
        helpOpen.value = true
      } else if (key === 'Home' && !showingDevice.value) {
        event.preventDefault()
        show([])
      }
    }
    document.addEventListener('keydown', shortcut)
    return () => document.removeEventListener('keydown', shortcut)
  }, [])

  return (
    <div class={fullscreen.value ? 'app fullscreen' : 'app'}>
      <Header />
      <main class="main">
        {failures.length > 0 && shown.length > 0 && <ProblemNotice failures={failures} />}
        {first === undefined ? (
          <NotFound failures={failures} />
        ) : shown.length === 1 ? (
          <SingleClock clock={first} device={showingDevice.value} />
        ) : (
          <>
            <ClockNotice />
            <ClockGrid clocks={shown} />
          </>
        )}
      </main>
      <Footer />
      <Help />
    </div>
  )
}
