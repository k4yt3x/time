import type { JSX } from 'preact'
import { useMemo } from 'preact/hooks'
import { now } from '../app/clock.ts'
import {
  changeSummary,
  countriesAt,
  countryClocks,
  describeClock,
  headingOf,
  headlineDate,
  list,
  longZoneName,
  relation,
  subtitleOf,
  upcomingChange,
} from '../app/describe.ts'
import { followLink } from '../app/router.ts'
import { settings } from '../app/settings.ts'
import { locale, messages } from '../i18n/index.ts'
import { type Clock, resolve } from '../places/resolve.ts'
import { tzdb } from '../places/tzdb.ts'
import { isoWeek } from '../time/format.ts'
import { offsetLabel } from '../time/offset.ts'
import { deviceZone, nextTransition, offsetAt, type Transition } from '../time/zone.ts'
import { ClockFace } from './ClockFace.tsx'
import { ClockNotice, clockFact } from './ClockStatus.tsx'
import { ChevronIcon } from './icons.tsx'

const minute = 60_000
const hour = 60 * minute
/** Countries named before the rest are summed up as a count. */
const countriesListed = 12

/**
 * One clock, filling the page. Below it, what someone checking the time somewhere needs: the
 * date there and how it stands to theirs, and anything that could mislead them. The rest waits
 * under Details.
 */
export function SingleClock({ clock, device }: { clock: Clock; device: boolean }) {
  const at = now.value
  const offset = offsetAt(clock.zone, at)
  const ownZone = useMemo(deviceZone, [])
  const ownOffset = offsetAt(ownZone, at)
  const description = describeClock(clock, at)
  const caption = description.detail

  // Worked out once a minute rather than every second.
  const thisMinute = Math.floor(at / minute) * minute
  const transition = useMemo(() => nextTransition(clock.zone, thisMinute), [clock, thisMinute])
  const upcoming = transition && upcomingChange(transition, at, settings.value.hourCycle)

  return (
    <article class="single">
      <header class="single-head">
        <h1 class="single-title">{headingOf(description)}</h1>
        {caption && <p class="single-subtitle">{caption}</p>}
      </header>
      <ClockFace at={at} offset={offset} class="single-clock" />
      <p class="single-date">{headlineDate(at, offset, ownOffset)}</p>
      <Facts
        clock={clock}
        at={at}
        offset={offset}
        ownOffset={device ? null : ownOffset}
        upcoming={upcoming}
      />
      <details
        class="details"
        open={settings.value.details}
        onToggle={(event) => {
          const open = event.currentTarget.open
          if (open !== settings.value.details) settings.value = { ...settings.value, details: open }
        }}
      >
        <summary>
          {messages.details}
          <ChevronIcon />
        </summary>
        {settings.value.details && (
          <Details
            clock={clock}
            at={at}
            offset={offset}
            caption={caption}
            transition={transition}
            soon={upcoming !== null}
          />
        )}
      </details>
    </article>
  )
}

/** What shows without asking: how the time stands to the reader's, and possible mistakes. */
function Facts({
  clock,
  at,
  offset,
  ownOffset,
  upcoming,
}: {
  clock: Clock
  at: number
  offset: number
  /** The reader's offset; null when this is their own clock. */
  ownOffset: number | null
  /** A change of the clocks within the week. */
  upcoming: string | null
}) {
  const { target } = clock
  const thisHour = Math.floor(at / hour) * hour
  const siblings = useMemo(
    () =>
      target.kind === 'place' && target.place.kind === 'country' && target.place.country
        ? countryClocks(target.place.country, target.place.zone, thisHour)
        : [],
    [target, thisHour],
  )

  const facts: JSX.Element[] = []
  if (ownOffset !== null) facts.push(<li key="relation">{relation(offset, ownOffset)}</li>)
  if (upcoming) facts.push(<li key="change">{upcoming}</li>)
  facts.push(<ClockNotice key="clock" as="li" />)
  if (target.kind === 'abbreviation') {
    const { alsoMeans, related } = target.abbreviation
    // The same letters for another zone, or a fixed offset typed to mean a zone's clock, put
    // the reader in the wrong hour.
    if (alsoMeans) {
      facts.push(
        <li key="also">
          {messages.alsoMeans(
            list(
              alsoMeans.map((meaning) => `${meaning.name} (${offsetLabel(meaning.offset)})`),
              'disjunction',
            ),
          )}
        </li>,
      )
    }
    if (related) facts.push(<RelatedLink key="related" token={related} at={at} />)
  }
  if (siblings.length > 0) {
    // Which of a country's clocks this is decides whether it is the right one.
    facts.push(
      <li key="siblings">
        {messages.severalZones(describeClock(clock, at).title)}
        <ul class="links">
          {siblings.map((sibling) => (
            <li key={sibling.token}>
              <a href={`/${sibling.token}`} onClick={followLink}>
                {sibling.name}
              </a>{' '}
              <span class="muted">{offsetLabel(sibling.offset)}</span>
            </li>
          ))}
        </ul>
      </li>,
    )
  }
  return <ul class="facts">{facts}</ul>
}

/** One of the details: a label over its value, and a note on the value where it needs one. */
function Fact({
  label,
  value,
  note,
  wide,
}: {
  label: string
  value: string
  note?: string | null
  /** Too long to stand beside the others, such as a list of countries. */
  wide?: boolean
}) {
  return (
    <div class={wide ? 'fact fact-wide' : 'fact'}>
      <dt class="fact-label">{label}</dt>
      <dd class="fact-value">{value}</dd>
      {note && <dd class="fact-note">{note}</dd>}
    </div>
  )
}

/**
 * What is there for those who want it: the week, the zone, its clock changes, the device's
 * clock. Nothing the page already says above.
 */
function Details({
  clock,
  at,
  offset,
  caption,
  transition,
  soon,
}: {
  clock: Clock
  at: number
  offset: number
  /** The line under the clock's name. */
  caption: string | null
  transition: Transition | null
  /** Whether the page already tells of the transition, as being within the week. */
  soon: boolean
}) {
  const { target, zone } = clock
  const thisHour = Math.floor(at / hour) * hour
  const countries = useMemo(
    () => (target.kind === 'offset' ? countriesAt(target.offset, thisHour) : []),
    [target, thisHour],
  )
  const unsaid = (text: string | null) => (text && !caption?.includes(text) ? text : null)
  const zoneName = unsaid(longZoneName(zone, at))
  const ianaName = unsaid(
    target.kind === 'place' ? target.place.ianaName : zone.kind === 'iana' ? zone.id : null,
  )
  const change = transition && changeSummary(transition, settings.value.hourCycle)
  const ownClock = clockFact()

  return (
    <div class="details-body">
      <dl class="detail-facts">
        <Fact
          label={messages.weekLabel}
          value={new Intl.NumberFormat(locale).format(isoWeek(at, offset))}
        />
        {target.kind !== 'offset' && (
          <Fact label={messages.offsetLabel} value={offsetLabel(offset)} />
        )}
        {(zoneName ?? ianaName) && (
          <Fact
            label={messages.zoneLabel}
            value={zoneName ?? ianaName ?? ''}
            note={zoneName ? ianaName : null}
          />
        )}
        {!soon && (
          <Fact
            label={messages.nextChangeLabel}
            value={change?.when ?? messages.none}
            note={
              change?.what ??
              (zone.kind === 'fixed' ? messages.fixedOffset : messages.inTheComingYear)
            }
          />
        )}
        {ownClock && (
          <Fact label={messages.yourClockLabel} value={ownClock.value} note={ownClock.note} />
        )}
        {target.kind === 'offset' && (
          <Fact
            wide
            label={messages.usedInLabel}
            value={
              countries.length === 0
                ? messages.none
                : list(
                    countries.length > countriesListed + 1
                      ? [
                          ...countries.slice(0, countriesListed),
                          messages.andMore(countries.length - countriesListed),
                        ]
                      : countries,
                  )
            }
          />
        )}
      </dl>
      <p class="footnote">{messages.tzdbVersion(tzdb.version)}</p>
    </div>
  )
}

function RelatedLink({ token, at }: { token: string; at: number }) {
  const resolution = resolve(token)
  if (!resolution.ok) return null
  const description = describeClock(resolution.clock, at)
  const subtitle = subtitleOf(description)
  return (
    <li>
      {messages.seeAlso}:{' '}
      <a href={`/${resolution.clock.token}`} onClick={followLink}>
        {subtitle ? `${description.title} (${subtitle})` : description.title}
      </a>
    </li>
  )
}
