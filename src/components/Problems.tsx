import { now } from '../app/clock.ts'
import { describeClock, list } from '../app/describe.ts'
import { clocks, followLink, show } from '../app/router.ts'
import { messages } from '../i18n/index.ts'
import type { Problem } from '../places/resolve.ts'
import { suggest } from '../places/search.ts'

export interface Failure {
  input: string
  problem: Problem
}

function explain({ input, problem }: Failure): string {
  switch (problem) {
    case 'unknown':
      return messages.unknownPlace(input)
    case 'invalid-offset':
      return messages.invalidOffset(input)
    case 'unsupported':
      return messages.unsupportedZone(input)
  }
}

/** The parts of the address that name no clock, when nothing else is shown. */
export function NotFound({ failures }: { failures: Failure[] }) {
  return (
    <article class="not-found">
      {failures.map((failure) => (
        <Explanation key={failure.input} failure={failure} />
      ))}
    </article>
  )
}

function Explanation({ failure }: { failure: Failure }) {
  const at = now.value
  const guesses = failure.problem === 'unknown' ? suggest(failure.input, 5) : []
  return (
    <section>
      <h1 class="not-found-title">{explain(failure)}</h1>
      {guesses.length > 0 && (
        <p>
          {messages.didYouMean}{' '}
          {guesses.map((clock, index) => (
            <span key={clock.token}>
              {index > 0 && ', '}
              <a href={`/${clock.token}`} onClick={followLink}>
                {describeClock(clock, at).title}
              </a>
            </span>
          ))}
          ?
        </p>
      )}
      {failure.problem === 'unknown' && <p class="muted">{messages.whatWorks}</p>}
    </section>
  )
}

/** The parts of the address that name no clock, beside the clocks that are shown. */
export function ProblemNotice({ failures }: { failures: Failure[] }) {
  return (
    <p class="notice" role="alert">
      {messages.couldNotShow(list(failures.map((failure) => `“${failure.input}”`)))}{' '}
      <button
        type="button"
        class="link-button"
        onClick={() => show(clocks.value.map((clock) => clock.token))}
      >
        {messages.removeThem}
      </button>
    </p>
  )
}
