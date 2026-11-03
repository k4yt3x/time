import { useSignalEffect } from '@preact/signals'
import { useRef } from 'preact/hooks'
import { helpOpen } from '../app/keys.ts'
import { followLink } from '../app/router.ts'
import { messages } from '../i18n/index.ts'
import { CloseIcon } from './icons.tsx'

/** What can follow the site's address, with examples that lead to their clocks. */
const addresses: [label: () => string, examples: string[]][] = [
  [() => messages.helpOffsets, ['utc+2', 'utc+5:30', 'utc+5.5', 'gmt-3', '+0530']],
  [() => messages.helpAbbreviations, ['EST', 'PT', 'CEST', 'IST', 'AoE']],
  [() => messages.helpCities, ['Tokyo', 'New_York', 'Sao_Paulo']],
  [() => messages.helpRegions, ['Japan', 'USA', 'California']],
  [() => messages.helpZones, ['Asia/Tokyo', 'America/New_York']],
  [() => messages.helpSeveral, ['Tokyo,London,UTC+5:30']],
]

const shortcuts: [keys: string[], does: () => string][] = [
  [['A–Z', '0–9', '+', '−'], () => messages.keyStartSearch],
  [['/'], () => messages.keyFocusSearch],
  [['↑', '↓'], () => messages.keyMove],
  [['Enter'], () => messages.keyShow],
  [['Shift', 'Enter'], () => messages.keyAdd],
  [['Esc'], () => messages.keyEscape],
  [['Home'], () => messages.keyHome],
  [['?'], () => messages.keyHelp],
  [['F11'], () => messages.keyFullscreen],
]

/** How to use the site, in a dialog over it: the header's ? button or the ? key opens it. */
export function Help() {
  const dialog = useRef<HTMLDialogElement>(null)

  useSignalEffect(() => {
    const element = dialog.current
    if (!element) return
    if (helpOpen.value && !element.open) element.showModal()
    if (!helpOpen.value && element.open) element.close()
  })

  const go = (event: MouseEvent) => {
    followLink(event)
    helpOpen.value = false
  }

  return (
    // A click on the backdrop lands on the dialog itself, and closes it; Escape is the keyboard's.
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape closes a modal dialog natively
    <dialog
      ref={dialog}
      class="help"
      aria-labelledby="help-title"
      onClose={() => {
        helpOpen.value = false
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) helpOpen.value = false
      }}
    >
      <div class="help-body">
        <header class="help-head">
          <h2 id="help-title">{messages.helpTitle}</h2>
          <button
            type="button"
            class="icon-button"
            aria-label={messages.close}
            title={messages.close}
            onClick={() => {
              helpOpen.value = false
            }}
          >
            <CloseIcon />
          </button>
        </header>

        <section>
          <h3>{messages.helpAddresses}</h3>
          <p>{messages.helpAddressesIntro}</p>
          <table class="help-table">
            <tbody>
              {addresses.map(([label, examples]) => (
                <tr key={label()}>
                  <th scope="row">{label()}</th>
                  <td>
                    {examples.map((example) => (
                      <a key={example} href={`/${example}`} onClick={go}>
                        <code>/{example}</code>
                      </a>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p class="muted">{messages.helpOffsetsNote}</p>
        </section>

        <section>
          <h3>{messages.helpSearch}</h3>
          <p>{messages.helpSearchText}</p>
        </section>

        <section>
          <h3>{messages.helpKeyboard}</h3>
          <table class="help-table">
            <tbody>
              {shortcuts.map(([keys, does]) => (
                <tr key={keys.join(' ')}>
                  <th scope="row">
                    {keys.map((key) => (
                      <kbd key={key}>{key}</kbd>
                    ))}
                  </th>
                  <td>{does()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h3>{messages.helpAccuracy}</h3>
          <p>{messages.helpAccuracyText}</p>
        </section>
      </div>
    </dialog>
  )
}
