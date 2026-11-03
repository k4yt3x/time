import { describe, expect, it } from 'vitest'
import { copyrightYears } from '../../src/app/site.ts'

describe('copyrightYears', () => {
  it('runs from the first year to this one', () => {
    expect(copyrightYears(2026)).toBe('2026')
    expect(copyrightYears(2027)).toBe('2026\u20132027')
    expect(copyrightYears(2031)).toBe('2026\u20132031')
  })

  it('stays at the first year for a clock set before it', () => {
    expect(copyrightYears(2019)).toBe('2026')
  })
})
