import { useMemo } from 'preact/hooks'
import { now } from '../app/clock.ts'
import { describeClock, relation, subtitleOf } from '../app/describe.ts'
import { followLink, remove, reorder } from '../app/router.ts'
import { locale, messages } from '../i18n/index.ts'
import type { Clock } from '../places/resolve.ts'
import { dayDifference, formatShortDate } from '../time/format.ts'
import { offsetLabel } from '../time/offset.ts'
import { deviceZone, offsetAt } from '../time/zone.ts'
import { ClockFace } from './ClockFace.tsx'
import { CloseIcon, GripIcon } from './icons.tsx'
import { useSortable } from './sortable.ts'

type Sortable = ReturnType<typeof useSortable>

/** Several clocks side by side, to be put in any order by dragging them by their handles. */
export function ClockGrid({ clocks }: { clocks: Clock[] }) {
  const at = now.value
  const ownZone = useMemo(deviceZone, [])
  const ownOffset = offsetAt(ownZone, at)
  const sortable = useSortable(reorder)
  const { moved } = sortable
  const movedClock = moved && clocks.find((clock) => clock.token === moved.token)
  return (
    <>
      <ul class="grid" ref={sortable.list}>
        {clocks.map((clock) => (
          <ClockCard
            key={clock.token}
            clock={clock}
            at={at}
            ownOffset={ownOffset}
            sortable={sortable}
          />
        ))}
      </ul>
      <p class="visually-hidden" role="status">
        {movedClock &&
          messages.clockMoved(
            describeClock(movedClock, at).title,
            (moved?.index ?? 0) + 1,
            clocks.length,
          )}
      </p>
    </>
  )
}

const dayNames = new Map([
  [-1, messages.yesterday],
  [0, messages.today],
  [1, messages.tomorrow],
])

function ClockCard({
  clock,
  at,
  ownOffset,
  sortable,
}: {
  clock: Clock
  at: number
  ownOffset: number
  sortable: Sortable
}) {
  const offset = offsetAt(clock.zone, at)
  const description = describeClock(clock, at)
  const { title } = description
  const subtitle = subtitleOf(description)
  const day = dayNames.get(dayDifference(at, offset, ownOffset))
  const date = formatShortDate(at, offset, locale)
  return (
    <li class="card" data-token={clock.token}>
      <div class="card-head">
        <div class="card-names">
          <a class="card-title" href={`/${clock.token}`} onClick={followLink}>
            {title}
          </a>
          {subtitle && <span class="card-subtitle">{subtitle}</span>}
        </div>
        <button
          type="button"
          class="icon-button card-handle"
          data-handle
          aria-label={messages.moveClock(title)}
          title={messages.moveClockHint}
          onPointerDown={(event) => sortable.onPointerDown(clock.token, event)}
          onKeyDown={(event) => sortable.onKeyDown(clock.token, event)}
        >
          <GripIcon />
        </button>
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
