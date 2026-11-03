import { computed } from '@preact/signals'
import { now } from '../app/clock.ts'
import { author, copyrightYears, repository } from '../app/site.ts'
import { messages } from '../i18n/index.ts'

/** The year by the synchronized clock, which changes once a year rather than each second. */
const year = computed(() => new Date(now.value).getFullYear())

/**
 * Whose the site is, under what licence, and where its source is, on one line: on a phone, without
 * the words between the links.
 */
export function Footer() {
  return (
    <footer class="footer">
      <span>
        {messages.copyright(copyrightYears(year.value))} <a href={author.url}>{author.name}</a>
      </span>
      <span aria-hidden="true">·</span>
      <span>
        <span class="footer-wordy">{messages.releasedUnder} </span>
        <a href={`${repository}/blob/master/LICENSE`}>{messages.license}</a>
      </span>
      <span aria-hidden="true">·</span>
      <a href={repository}>
        <span class="footer-wordy">{messages.sourceOn} </span>
        GitHub
      </a>
    </footer>
  )
}
