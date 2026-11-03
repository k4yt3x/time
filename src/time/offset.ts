/** UTC offsets, in whole minutes east of UTC. */

/** The range of offsets in use anywhere since 1970: Anywhere on Earth to the Line Islands. */
export const minOffset = -12 * 60
export const maxOffset = 14 * 60

const shape = /^(zulu|utc|gmt|ut|z)?(\s*)([+-]?)\s*(.*)$/

/**
 * Reads a UTC offset in the forms people write one: UTC+2, utc+5:30, UTC+05:30, utc+0530,
 * utc+5.5, GMT-3, gmt8, +5:30, UTC−3 with a minus sign, and "utc 2", which is what "utc+2"
 * becomes wherever something decoded the plus as a space. UTC, GMT, UT, Z and Zulu alone are
 * UTC itself.
 *
 * A decimal is a fraction of an hour when it is a quarter, a half or three quarters (5.5 is
 * 5:30, 5.75 is 5:45); otherwise the dot separates hours from minutes, as in 5.30 or 8.45.
 *
 * Returns the offset in minutes; null when the text is not an offset at all, such as a place
 * name; and 'invalid' when it is shaped like an offset that no clock can show.
 */
export function parseOffset(text: string): number | 'invalid' | null {
  const normalized = text
    .trim()
    .toLowerCase()
    .replace(/[\u2212\u2012\u2013\u2014\ufe63\uff0d]/g, '-')
    .replace(/[\ufe62\uff0b]/g, '+')
  const match = shape.exec(normalized)
  if (!match) return null
  const [, prefix, , sign, rest = ''] = match
  if (!prefix && !sign) return null
  if (rest === '') return sign ? 'invalid' : 0
  const magnitude = parseMagnitude(rest)
  if (magnitude === null) {
    // "Zurich" and "Utah" start like an offset; only a sign or a digit after the prefix makes
    // the text an offset that went wrong rather than a name.
    return sign || /^\d/.test(rest) ? 'invalid' : null
  }
  const offset = sign === '-' ? -magnitude : magnitude
  if (offset < minOffset || offset > maxOffset) return 'invalid'
  return offset === 0 ? 0 : offset
}

/** Hours and minutes after the sign, in minutes; null if they are not written as such. */
function parseMagnitude(text: string): number | null {
  let match = /^(\d{1,2})$/.exec(text)
  if (match) return Number(match[1]) * 60
  match = /^(\d{1,2}):(\d{2})$/.exec(text) ?? /^(\d{1,2})(\d{2})$/.exec(text)
  if (match) return hoursAndMinutes(match[1], match[2])
  match = /^(\d{1,2})\.(\d{1,2})$/.exec(text)
  if (match) {
    const [, hours = '', fraction = ''] = match
    const quarters = Number(`0.${fraction}`) * 4
    if (Number.isInteger(quarters)) return Number(hours) * 60 + quarters * 15
    return fraction.length === 2 ? hoursAndMinutes(hours, fraction) : null
  }
  return null
}

function hoursAndMinutes(hours = '', minutes = ''): number | null {
  const m = Number(minutes)
  return m < 60 ? Number(hours) * 60 + m : null
}

/** The offset as this site's URLs write it: UTC, UTC+2, UTC+5:30, UTC-3. */
export function offsetToken(offset: number): string {
  return offset === 0 ? 'UTC' : `UTC${offset < 0 ? '-' : '+'}${hoursMinutes(offset)}`
}

/** The offset for reading: as offsetToken, with a true minus sign. */
export function offsetLabel(offset: number): string {
  return offset === 0 ? 'UTC' : `UTC${offset < 0 ? '\u2212' : '+'}${hoursMinutes(offset)}`
}

function hoursMinutes(offset: number): string {
  const total = Math.abs(offset)
  const minutes = total % 60
  return minutes === 0
    ? `${(total - minutes) / 60}`
    : `${(total - minutes) / 60}:${String(minutes).padStart(2, '0')}`
}
