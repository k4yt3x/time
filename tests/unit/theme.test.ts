import { describe, expect, it } from 'vitest'
import { defaultColors, isDark, parseTheme } from '../../src/app/theme.ts'

describe('parseTheme', () => {
  it('takes a stored theme as it is', () => {
    const theme = {
      mode: 'custom',
      colors: { background: '#336699', text: '#FFEECC', accent: '#ff0000' },
    }
    expect(parseTheme(theme)).toEqual(theme)
  })

  it('falls back on the defaults for what is missing or malformed', () => {
    expect(parseTheme(null)).toEqual({ mode: 'auto', colors: defaultColors })
    expect(parseTheme('dark')).toEqual({ mode: 'auto', colors: defaultColors })
    expect(
      parseTheme({ mode: 'sepia', colors: { background: 'red', text: '#12345', accent: 7 } }),
    ).toEqual({ mode: 'auto', colors: defaultColors })
    expect(parseTheme({ mode: 'dark', colors: { text: '#000000' } })).toEqual({
      mode: 'dark',
      colors: { ...defaultColors, text: '#000000' },
    })
  })
})

describe('isDark', () => {
  it.each([
    ['#000000', true],
    ['#1d2a3a', true],
    ['#336699', true],
    ['#777777', true],
    ['#808080', false],
    ['#f3ede2', false],
    ['#ffffff', false],
    ['#FFEECC', false],
  ])('calls %s dark: %s', (color, dark) => {
    expect(isDark(color)).toBe(dark)
  })
})
