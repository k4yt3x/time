/**
 * The interface's language and the locale it writes dates and times in.
 *
 * Only English exists so far. Another language is a catalogue beside en.ts, chosen here from
 * the reader's languages; nothing else names a language.
 */

import { en } from './en.ts'
import type { Messages } from './messages.ts'

const catalogues: Record<string, Messages> = { en }

const preferred = typeof navigator === 'undefined' ? [] : [...navigator.languages]

/** The language of the interface. */
export const language =
  preferred.map((tag) => tag.split('-')[0] ?? '').find((tag) => tag in catalogues) ?? 'en'

export const messages: Messages = catalogues[language] ?? en

/**
 * The locale dates, numbers and names are written in: the reader's own variety of the
 * interface's language, such as en-GB, so the date reads the way they write it.
 */
export const locale = preferred.find((tag) => tag.split('-')[0] === language) ?? language
