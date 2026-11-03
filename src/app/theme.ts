/**
 * The page's colours: the system's (auto), light, dark, or the reader's own, kept in the
 * browser.
 *
 * The build also inlines this module into the page's head and runs `applyTheme(readTheme())`
 * there (vite.config.ts), so that a chosen theme is in place before the page first paints
 * rather than flashing the system's. That is why it imports nothing.
 */

export type ThemeMode = 'auto' | 'light' | 'dark' | 'custom'

export interface ThemeColors {
  background: string
  text: string
  accent: string
}

export interface Theme {
  mode: ThemeMode
  /** The colours of the custom theme, kept while another is chosen. */
  colors: ThemeColors
}

export const themeModes: readonly ThemeMode[] = ['auto', 'light', 'dark', 'custom']

export const defaultColors: ThemeColors = {
  background: '#1d2a3a',
  text: '#f3ede2',
  accent: '#f2a65a',
}

const storageKey = 'theme'
const hexColor = /^#[0-9a-f]{6}$/i

/** A stored theme as it should be: whatever is missing or malformed takes its default. */
export function parseTheme(stored: unknown): Theme {
  const value = (typeof stored === 'object' && stored !== null ? stored : {}) as {
    mode?: unknown
    colors?: Partial<Record<keyof ThemeColors, unknown>>
  }
  const colors = typeof value.colors === 'object' && value.colors !== null ? value.colors : {}
  const color = (name: keyof ThemeColors) => {
    const given = colors[name]
    return typeof given === 'string' && hexColor.test(given) ? given : defaultColors[name]
  }
  return {
    mode: themeModes.find((mode) => mode === value.mode) ?? 'auto',
    colors: { background: color('background'), text: color('text'), accent: color('accent') },
  }
}

export function readTheme(): Theme {
  try {
    return parseTheme(JSON.parse(localStorage.getItem(storageKey) ?? 'null'))
  } catch (error) {
    console.warn('Could not read the saved theme:', error)
    return parseTheme(null)
  }
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(theme))
  } catch (error) {
    console.warn('Could not save the theme:', error)
  }
}

/** Whether a colour such as "#1d2a3a" is dark enough for light text on it. */
export function isDark(color: string): boolean {
  const channel = (start: number) => {
    const value = Number.parseInt(color.slice(start, start + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  // Relative luminance, as WCAG defines it; below about a fifth, light text reads better.
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5) < 0.2
}

/** Shows the page in a theme. */
export function applyTheme({ mode, colors }: Theme): void {
  const root = document.documentElement
  if (mode === 'auto') delete root.dataset.theme
  else root.dataset.theme = mode
  for (const [name, value] of Object.entries(colors)) {
    if (mode === 'custom') root.style.setProperty(`--custom-${name}`, value)
    else root.style.removeProperty(`--custom-${name}`)
  }
  // The colours left to light-dark(), and the browser's own controls and scrollbars, follow
  // whether the custom background is dark or light.
  root.style.colorScheme = mode === 'custom' ? (isDark(colors.background) ? 'dark' : 'light') : ''

  // The browser's toolbar, where it takes its colour from the page: each theme-color element is
  // for the system's light or dark scheme, and a chosen theme sets them all.
  const metas = [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')]
  for (const meta of metas) meta.dataset.system ??= meta.content
  const systemColor = (scheme: 'light' | 'dark') =>
    metas.find((meta) => meta.media.includes(scheme))?.dataset.system
  for (const meta of metas) {
    const own = meta.dataset.system ?? meta.content
    meta.content =
      mode === 'custom' ? colors.background : mode === 'auto' ? own : (systemColor(mode) ?? own)
  }
}
