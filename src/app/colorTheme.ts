/** The theme the page shows, as the reader last chose it. */

import { effect, signal } from '@preact/signals'
import { applyTheme, readTheme, saveTheme, type Theme } from './theme.ts'

export const theme = signal<Theme>(readTheme())

effect(() => {
  applyTheme(theme.value)
  saveTheme(theme.value)
})
