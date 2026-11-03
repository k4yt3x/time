import { useMemo } from 'preact/hooks'
import { now } from '../app/clock.ts'
import { describeClock, relation, subtitleOf } from '../app/describe.ts'
import { followLink, remove } from '../app/router.ts'
import { locale, messages } from '../i18n/index.ts'
import type { Clock } from '../places/resolve.ts'
import { dayDifference, formatShortDate } from '../time/format.ts'
import { offsetLabel } from '../time/offset.ts'
import { deviceZone, offsetAt } from '../time/zone.ts'
import { ClockFace } from './ClockFace.tsx'
import { CloseIcon } from './icons.tsx'

/** Several clocks side by side. */
export function ClockGrid({ clocks }: { clocks: Clock[] }) {
  const at = now.value
  const ownZone = useMemo(deviceZone, [])
  const ownOffset = offsetAt(ownZone, at)
  return (
    <ul class="grid">
      {clocks.map((clock) => (
        <ClockCard key={clock.token} clock={clock} at={at} ownOffset={ownOffset} />
      ))}
    </ul>
  )
}

const dayNames = new Map([
  [-1, messages.yesterday],
  [0, messages.today],
  [1, messages.tomorrow],
])

function ClockCard({ clock, at, ownOffset }: { clock: Clock; at: number; ownOffset: number }) {
  const offset = offsetAt(clock.zone, at)
  const description = describeClock(clock, at)
  const { title } = description
  const subtitle = subtitleOf(description)
  const day = dayNames.get(dayDifference(at, offset, ownOffset))
  const date = formatShortDate(at, offset, locale)
  return (
    <li class="card">
      <div class="card-head">
        <div class="card-names">
          <a class="card-title" href={`/${clock.token}`} onClick={followLink}>
            {title}
          </a>
          {subtitle && <span class="card-subtitle">{subtitle}</span>}
        </div>
        <button
          type="button"
          class="icon-button"
          aria-label={messages.removeClock(title)}
          title={messages.removeClock(title)}
          onClick={() => remove(clock.token)}
        >
          <CloseIcon />
        </button>
      </div>
      <ClockFace at={at} offset={offset} class="card-clock" />
      <p class="card-meta">
        <span>{day ? messages.dayAndDate(day, date) : date}</span>
        <span>
          {offsetLabel(offset)} · {relation(offset, ownOffset)}
        </span>
      </p>
    </li>
  )
}
