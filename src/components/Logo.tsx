import { now } from '../app/clock.ts'
import { followLink } from '../app/router.ts'
import { author } from '../app/site.ts'
import { messages } from '../i18n/index.ts'
import { clockHands } from '../time/format.ts'

/**
 * The site's name, beside a clock face whose hands tell the reader's own time, and who made it.
 */
export function Logo() {
  const at = now.value
  const { hour, minute } = clockHands(at, -new Date(at).getTimezoneOffset())
  return (
    <div class="brand">
      <a class="brand-home" href="/" onClick={followLink}>
        <svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
          <circle class="brand-face" cx="16" cy="16" r="15" />
          <line
            class="brand-hand"
            x1="16"
            y1="16"
            x2="16"
            y2="8.5"
            transform={`rotate(${hour} 16 16)`}
          />
          <line
            class="brand-hand"
            x1="16"
            y1="16"
            x2="16"
            y2="4.5"
            transform={`rotate(${minute} 16 16)`}
          />
          <circle class="brand-pin" cx="16" cy="16" r="2" />
        </svg>
        {messages.siteName}
      </a>
      <span class="brand-by">
        {messages.by} <a href={author.url}>{author.name}</a>
      </span>
    </div>
  )
}
