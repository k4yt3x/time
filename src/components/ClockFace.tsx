import { settings } from '../app/settings.ts'
import { locale } from '../i18n/index.ts'
import { formatTime } from '../time/format.ts'
import { FitText } from './FitText.tsx'

/** An ISO 8601 date and time with offset, for a <time> element. */
function isoAt(at: number, offset: number): string {
  const wall = new Date(at + offset * 60_000).toISOString().slice(0, 19)
  const sign = offset < 0 ? '-' : '+'
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0')
  const minutes = String(Math.abs(offset) % 60).padStart(2, '0')
  return `${wall}${sign}${hours}:${minutes}`
}

/** The time of day at `offset`, as large as fits. */
export function ClockFace({
  at,
  offset,
  class: className,
}: {
  at: number
  offset: number
  class?: string
}) {
  const { time, dayPeriod } = formatTime(
    at,
    offset,
    locale,
    settings.value.hourCycle,
    settings.value.seconds,
  )
  return (
    <FitText class={className} fitKey={`${time.length} ${dayPeriod ?? ''}`}>
      <time class="clock" dateTime={isoAt(at, offset)}>
        {time}
        {/* A space of its own size keeps "9:04 PM" readable when copied or read aloud. */}
        {dayPeriod && <span class="day-period"> {dayPeriod}</span>}
      </time>
    </FitText>
  )
}
