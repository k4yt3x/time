import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { now } from '../app/clock.ts'
import { describeClock, subtitleOf } from '../app/describe.ts'
import { pageKey, startsSearch } from '../app/keys.ts'
import { add, followLink, show, showingDevice } from '../app/router.ts'
import { settings } from '../app/settings.ts'
import { locale, messages } from '../i18n/index.ts'
import { type Clock, deviceClock, resolve } from '../places/resolve.ts'
import { suggest } from '../places/search.ts'
import { formatTime } from '../time/format.ts'
import { offsetLabel } from '../time/offset.ts'
import { offsetAt } from '../time/zone.ts'
import { LocateIcon, PlusIcon, SearchIcon } from './icons.tsx'

/**
 * The search box. Choosing a suggestion shows that clock alone; its plus button, or Shift+Enter,
 * adds it beside the clocks shown. "/" anywhere on the page focuses it, and typing anywhere
 * starts a search. Inside it, on any page
 * but the reader's own clock, is the way back to that.
 */
export function Search() {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const results = useMemo(() => suggest(query), [query])

  useEffect(() => {
    // "/" goes to the box; a character typed anywhere else starts a search with it.
    const begin = (event: KeyboardEvent) => {
      const key = pageKey(event)
      if (key === null || (key !== '/' && !startsSearch(key))) return
      event.preventDefault()
      input.current?.focus()
      if (key !== '/') {
        setQuery(key)
        setActive(0)
        setOpen(true)
      }
    }
    document.addEventListener('keydown', begin)
    return () => document.removeEventListener('keydown', begin)
  }, [])

  const choose = (clock: Clock | undefined, adding: boolean) => {
    if (!clock) return
    if (adding) add(clock.token)
    else show([clock.token])
    setQuery('')
    setOpen(false)
    input.current?.blur()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setOpen(true)
        setActive((index) => Math.min(index + 1, results.length - 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        setActive((index) => Math.max(index - 1, 0))
        break
      case 'Enter': {
        event.preventDefault()
        const typed = resolve(query)
        choose(results[active] ?? (typed.ok ? typed.clock : undefined), event.shiftKey)
        break
      }
      case 'Escape':
        if (query !== '') setQuery('')
        else input.current?.blur()
        break
    }
  }

  const listing = open && query.trim() !== ''
  const away = !showingDevice.value
  return (
    <div class="search">
      <SearchIcon />
      <input
        ref={input}
        class={away ? 'with-your-time' : undefined}
        type="text"
        role="combobox"
        enterKeyHint="search"
        aria-label={messages.searchLabel}
        aria-expanded={listing && results.length > 0}
        aria-controls="search-results"
        aria-autocomplete="list"
        aria-activedescendant={listing && results[active] ? `search-result-${active}` : undefined}
        placeholder={messages.searchPlaceholder}
        title={messages.searchHint}
        autoComplete="off"
        autoCapitalize="off"
        spellcheck={false}
        value={query}
        onInput={(event) => {
          setQuery(event.currentTarget.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {away && (
        <a
          class="your-time"
          href="/"
          onClick={followLink}
          aria-label={messages.yourTime}
          title={messages.yourTimeZone(describeClock(deviceClock(), Date.now()).title)}
        >
          <LocateIcon />
          <span class="your-time-label">{messages.yourTime}</span>
        </a>
      )}
      {listing &&
        (results.length > 0 ? (
          // Pressing in the list must not take the focus from the box, which would close it.
          <div
            id="search-results"
            role="listbox"
            class="search-results"
            onMouseDown={(event) => event.preventDefault()}
          >
            {results.map((clock, index) => (
              <Result
                key={clock.token}
                clock={clock}
                index={index}
                active={index === active}
                onHover={() => setActive(index)}
                onChoose={(adding) => choose(clock, adding)}
              />
            ))}
          </div>
        ) : (
          <div class="search-results search-empty" role="status">
            {messages.noMatches(query.trim())}
          </div>
        ))}
    </div>
  )
}

function Result({
  clock,
  index,
  active,
  onHover,
  onChoose,
}: {
  clock: Clock
  index: number
  active: boolean
  onHover: () => void
  onChoose: (adding: boolean) => void
}) {
  const at = now.value
  const offset = offsetAt(clock.zone, at)
  const description = describeClock(clock, at)
  const { title } = description
  const subtitle = subtitleOf(description)
  const { time, dayPeriod } = formatTime(at, offset, locale, settings.value.hourCycle, false)
  return (
    // The box handles the keyboard for its options, as a combobox does, so an option never
    // takes the focus itself.
    // biome-ignore lint/a11y/useKeyWithClickEvents: chosen from the keyboard in the box
    <div
      id={`search-result-${index}`}
      role="option"
      tabIndex={-1}
      aria-selected={active}
      class="search-result"
      onMouseMove={onHover}
      onClick={() => onChoose(false)}
    >
      <span class="result-names">
        <span class="result-title">{title}</span>
        {subtitle && <span class="result-subtitle">{subtitle}</span>}
      </span>
      <span class="result-time">
        {dayPeriod ? `${time} ${dayPeriod}` : time}
        <span class="muted"> {offsetLabel(offset)}</span>
      </span>
      <button
        type="button"
        tabIndex={-1}
        class="icon-button"
        aria-label={messages.addClock(title)}
        title={messages.addClock(title)}
        onClick={(event) => {
          event.stopPropagation()
          onChoose(true)
        }}
      >
        <PlusIcon />
      </button>
    </div>
  )
}
