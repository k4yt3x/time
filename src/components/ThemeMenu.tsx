import type { JSX } from 'preact'
import { theme } from '../app/colorTheme.ts'
import { type ThemeColors, type ThemeMode, themeModes } from '../app/theme.ts'
import { messages } from '../i18n/index.ts'
import { ContrastIcon, MoonIcon, PaletteIcon, SunIcon } from './icons.tsx'

const icons: Record<ThemeMode, () => JSX.Element> = {
  auto: ContrastIcon,
  light: SunIcon,
  dark: MoonIcon,
  custom: PaletteIcon,
}

/**
 * The page's colours: the system's, light, dark, or the reader's own, picked in a popover that
 * the browser closes on Escape or a click elsewhere.
 */
export function ThemeMenu() {
  const { mode, colors } = theme.value
  const names: Record<ThemeMode, string> = {
    auto: messages.themeAuto,
    light: messages.themeLight,
    dark: messages.themeDark,
    custom: messages.themeCustom,
  }
  const colorNames: [keyof ThemeColors, string][] = [
    ['background', messages.colorBackground],
    ['text', messages.colorText],
    ['accent', messages.colorAccent],
  ]
  const Icon = icons[mode]
  return (
    <>
      <button
        type="button"
        class="icon-button"
        popovertarget="theme-menu"
        aria-label={messages.theme}
        title={messages.theme}
      >
        <Icon />
      </button>
      <div id="theme-menu" popover="auto" class="theme-menu">
        <fieldset class="theme-modes">
          <legend>{messages.theme}</legend>
          {themeModes.map((option) => {
            const OptionIcon = icons[option]
            return (
              <label key={option} class="theme-mode">
                <input
                  type="radio"
                  name="theme"
                  value={option}
                  checked={mode === option}
                  onChange={() => {
                    theme.value = { mode: option, colors }
                  }}
                />
                <span class="theme-mode-icon">
                  <OptionIcon />
                </span>
                {names[option]}
              </label>
            )
          })}
        </fieldset>
        {mode === 'custom' && (
          <div class="theme-colors">
            {colorNames.map(([name, label]) => (
              <label key={name} class="theme-color">
                <input
                  type="color"
                  value={colors[name]}
                  onInput={(event) => {
                    theme.value = { mode, colors: { ...colors, [name]: event.currentTarget.value } }
                  }}
                />
                {label}
              </label>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
