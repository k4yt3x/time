/** Clock, calendar and duration text. Every function takes the locale to write in. */

export type HourCycle = 'h12' | 'h23'

const minute = 60_000
const day = 24 * 60 * minute

const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>()

/** Formats instants as wall time at a given offset: shifted, then written as UTC. */
function dateTimeFormatter(locale: string, options: Intl.DateTimeFormatOptions) {
  const key = `${locale} ${JSON.stringify(options)}`
  let formatter = dateTimeFormatters.get(key)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' })
    dateTimeFormatters.set(key, formatter)
  }
  return formatter
}

export interface ClockText {
  /** The digits and their separators, such as "9:04:08". */
  time: string
  /** AM or PM, or the locale's word for them; null on a 24-hour clock. */
  dayPeriod: string | null
}

/** The time of day at `offset` minutes east of UTC at the instant `at`. */
export function formatTime(
  at: number,
  offset: number,
  locale: string,
  hourCycle: HourCycle,
  seconds: boolean,
): ClockText {
  const parts = dateTimeFormatter(locale, {
    hourCycle,
    hour: hourCycle === 'h23' ? '2-digit' : 'numeric',
    minute: '2-digit',
    ...(seconds ? { second: '2-digit' } : {}),
  }).formatToParts(at + offset * minute)
  return {
    time: parts
      .filter((part) => part.type !== 'dayPeriod')
      .map((part) => part.value)
      .join('')
      .trim(),
    dayPeriod: parts.find((part) => part.type === 'dayPeriod')?.value ?? null,
  }
}

/** The full date, such as "Wednesday, November 4, 2026". */
export function formatDate(at: number, offset: number, locale: string): string {
  return dateTimeFormatter(locale, { dateStyle: 'full' }).format(at + offset * minute)
}

/** The day of the week, such as "Sunday". */
export function formatWeekday(at: number, offset: number, locale: string): string {
  return dateTimeFormatter(locale, { weekday: 'long' }).format(at + offset * minute)
}

/** A short date, such as "Tue, Nov 3". */
export function formatShortDate(at: number, offset: number, locale: string): string {
  return dateTimeFormatter(locale, { weekday: 'short', month: 'short', day: 'numeric' }).format(
    at + offset * minute,
  )
}

/** A short date and time of day, such as "Sun, Mar 14, 2027, 02:00". */
export function formatShortDateTime(
  at: number,
  offset: number,
  locale: string,
  hourCycle: HourCycle,
): string {
  return dateTimeFormatter(locale, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: hourCycle === 'h23' ? '2-digit' : 'numeric',
    minute: '2-digit',
    hourCycle,
  }).format(at + offset * minute)
}

/**
 * The ISO 8601 week number of the date at `offset` at the instant `at`. Around New Year a week
 * can belong to the next year or the last: December 30, 2024 is in week 1.
 */
export function isoWeek(at: number, offset: number): number {
  const date = new Date(at + offset * minute)
  const midnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  // A week belongs to the year its Thursday is in.
  const thursday = midnight + (3 - ((date.getUTCDay() + 6) % 7)) * day
  const yearStart = Date.UTC(new Date(thursday).getUTCFullYear(), 0, 1)
  return 1 + Math.floor((thursday - yearStart) / (7 * day))
}

/** How many calendar days the date at offset `a` is after the date at offset `b`. */
export function dayDifference(at: number, a: number, b: number): number {
  return Math.floor((at + a * minute) / day) - Math.floor((at + b * minute) / day)
}

/** A length of time in whole minutes, such as "5 hours 30 minutes". */
export function formatDuration(minutes: number, locale: string): string {
  const total = Math.abs(minutes)
  const hours = Math.floor(total / 60)
  const parts = [
    hours > 0 ? unit(locale, 'hour').format(hours) : null,
    total % 60 > 0 || hours === 0 ? unit(locale, 'minute').format(total % 60) : null,
  ].filter((part) => part !== null)
  return new Intl.ListFormat(locale, { type: 'unit', style: 'narrow' }).format(parts)
}

function unit(locale: string, name: 'hour' | 'minute') {
  return new Intl.NumberFormat(locale, { style: 'unit', unit: name, unitDisplay: 'long' })
}

/**
 * A length of time in milliseconds, with as many decimals as an uncertainty of `uncertainty`
 * milliseconds warrants: "0.214s", "2.3s"; whole minutes beyond two of them.
 */
export function formatSeconds(ms: number, uncertainty: number, locale: string): string {
  const magnitude = Math.abs(ms)
  if (magnitude >= 120_000) return formatDuration(Math.round(magnitude / 60_000), locale)
  const digits = uncertainty < 10 ? 3 : uncertainty < 100 ? 2 : 1
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'second',
    unitDisplay: 'narrow',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(magnitude / 1000)
}

/**
 * Where the hands of an analogue clock point at `offset` at the instant `at`, in degrees
 * clockwise from twelve.
 */
export function clockHands(at: number, offset: number): { hour: number; minute: number } {
  const date = new Date(at + offset * minute)
  const minutes = date.getUTCMinutes()
  return { hour: ((date.getUTCHours() % 12) + minutes / 60) * 30, minute: minutes * 6 }
}
