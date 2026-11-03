import { synchronize, syncState } from '../app/clock.ts'
import { locale, messages } from '../i18n/index.ts'
import { formatSeconds } from '../time/format.ts'

/** Below this difference, in milliseconds, the device's clock counts as exact. */
const exactWithin = 100
/** From this difference, in milliseconds, the device's clock is off by enough to point out. */
const noticeableFrom = 500

/**
 * The device's clock where it matters to the times shown: off by half a second or more, which
 * the times here correct, or unchecked for want of a time server. Nothing otherwise.
 */
export function ClockNotice({ as: Element = 'p' }: { as?: 'p' | 'li' }) {
  const state = syncState.value
  if (state.status === 'failed') {
    return (
      <Element class="clock-notice clock-failed" role="status">
        {messages.syncFailed}{' '}
        <button type="button" class="link-button" onClick={() => void synchronize()}>
          {messages.retry}
        </button>
      </Element>
    )
  }
  if (state.status !== 'synced' || Math.abs(state.offset) < noticeableFrom) return null
  const amount = formatSeconds(state.offset, state.uncertainty, locale)
  return (
    <Element class="clock-notice" role="status" title={messages.syncedWith(state.source)}>
      {/* The offset is the true time minus the device's: positive when the device is behind. */}
      {(state.offset > 0 ? messages.clockBehindNotice : messages.clockAheadNotice)(amount)}
    </Element>
  )
}

/** The device's clock as one of the details; null where ClockNotice tells of it instead. */
export function clockFact(): { value: string; note: string | null } | null {
  const state = syncState.value
  if (state.status === 'syncing') return { value: messages.checking, note: null }
  if (state.status === 'failed' || Math.abs(state.offset) >= noticeableFrom) return null
  const { offset, uncertainty, source } = state
  const seconds = (ms: number) => formatSeconds(ms, uncertainty, locale)
  if (Math.abs(offset) <= Math.max(exactWithin, uncertainty)) {
    return {
      value: messages.exact,
      note: messages.clockPrecision(seconds(Math.abs(offset) + uncertainty), source),
    }
  }
  return {
    value: (offset > 0 ? messages.behind : messages.ahead)(seconds(offset)),
    note: messages.clockPrecision(seconds(uncertainty), source),
  }
}
