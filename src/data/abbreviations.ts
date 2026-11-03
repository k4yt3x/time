/**
 * Time zone abbreviations people type. An abbreviation for standard or daylight time (EST,
 * CEST) is the fixed offset it stands for; a generic one (ET, PT) follows its zone's clock
 * through daylight saving time. Where the same letters have several meanings, the entry is the
 * one most people mean and lists the others.
 */

import type { TimeZone } from '../time/zone.ts'

export interface Abbreviation {
  /** As it is written, which is also its URL. */
  code: string
  /** Other spellings that mean the same. */
  aliases?: readonly string[]
  /** What it stands for, in English. */
  name: string
  zone: TimeZone
  /** Other meanings of the same letters. */
  alsoMeans?: readonly { name: string; offset: number }[]
  /** The clock it goes with: the generic one for a fixed one (EST → ET), and a place for some. */
  related?: string
}

const fixed = (hours: number, minutes = 0): TimeZone => ({
  kind: 'fixed',
  offset: hours < 0 ? hours * 60 - minutes : hours * 60 + minutes,
})
const iana = (id: string): TimeZone => ({ kind: 'iana', id })

export const abbreviations: readonly Abbreviation[] = [
  // North America
  { code: 'ET', name: 'Eastern Time', zone: iana('America/New_York') },
  { code: 'EST', name: 'Eastern Standard Time', zone: fixed(-5), related: 'ET' },
  { code: 'EDT', name: 'Eastern Daylight Time', zone: fixed(-4), related: 'ET' },
  { code: 'CT', name: 'Central Time', zone: iana('America/Chicago') },
  {
    code: 'CST',
    name: 'Central Standard Time',
    zone: fixed(-6),
    related: 'CT',
    alsoMeans: [
      { name: 'China Standard Time', offset: 8 * 60 },
      { name: 'Cuba Standard Time', offset: -5 * 60 },
    ],
  },
  { code: 'CDT', name: 'Central Daylight Time', zone: fixed(-5), related: 'CT' },
  { code: 'MT', name: 'Mountain Time', zone: iana('America/Denver') },
  { code: 'MST', name: 'Mountain Standard Time', zone: fixed(-7), related: 'MT' },
  { code: 'MDT', name: 'Mountain Daylight Time', zone: fixed(-6), related: 'MT' },
  { code: 'PT', name: 'Pacific Time', zone: iana('America/Los_Angeles') },
  {
    code: 'PST',
    name: 'Pacific Standard Time',
    zone: fixed(-8),
    related: 'PT',
    alsoMeans: [{ name: 'Philippine Standard Time', offset: 8 * 60 }],
  },
  { code: 'PDT', name: 'Pacific Daylight Time', zone: fixed(-7), related: 'PT' },
  { code: 'AKT', name: 'Alaska Time', zone: iana('America/Anchorage') },
  { code: 'AKST', name: 'Alaska Standard Time', zone: fixed(-9), related: 'AKT' },
  { code: 'AKDT', name: 'Alaska Daylight Time', zone: fixed(-8), related: 'AKT' },
  { code: 'HST', name: 'Hawaii-Aleutian Standard Time', zone: fixed(-10), related: 'Honolulu' },
  { code: 'HDT', name: 'Hawaii-Aleutian Daylight Time', zone: fixed(-9), related: 'Adak' },
  { code: 'AT', name: 'Atlantic Time', zone: iana('America/Halifax') },
  {
    code: 'AST',
    name: 'Atlantic Standard Time',
    zone: fixed(-4),
    related: 'AT',
    alsoMeans: [{ name: 'Arabia Standard Time', offset: 3 * 60 }],
  },
  { code: 'ADT', name: 'Atlantic Daylight Time', zone: fixed(-3), related: 'AT' },
  { code: 'NT', name: 'Newfoundland Time', zone: iana('America/St_Johns') },
  { code: 'NST', name: 'Newfoundland Standard Time', zone: fixed(-3, 30), related: 'NT' },
  { code: 'NDT', name: 'Newfoundland Daylight Time', zone: fixed(-2, 30), related: 'NT' },

  // South America
  { code: 'ART', name: 'Argentina Time', zone: fixed(-3) },
  { code: 'BRT', name: 'Brasília Time', zone: fixed(-3) },
  { code: 'CLT', name: 'Chile Standard Time', zone: fixed(-4), related: 'Santiago' },
  { code: 'CLST', name: 'Chile Summer Time', zone: fixed(-3), related: 'Santiago' },
  { code: 'COT', name: 'Colombia Time', zone: fixed(-5) },
  { code: 'PET', name: 'Peru Time', zone: fixed(-5) },
  { code: 'UYT', name: 'Uruguay Time', zone: fixed(-3) },
  { code: 'VET', name: 'Venezuela Time', zone: fixed(-4) },

  // Europe
  { code: 'WET', name: 'Western European Time', zone: fixed(0), related: 'Lisbon' },
  { code: 'WEST', name: 'Western European Summer Time', zone: fixed(1), related: 'Lisbon' },
  {
    code: 'BST',
    name: 'British Summer Time',
    zone: fixed(1),
    related: 'London',
    alsoMeans: [{ name: 'Bangladesh Standard Time', offset: 6 * 60 }],
  },
  { code: 'CET', name: 'Central European Time', zone: fixed(1), related: 'Berlin' },
  { code: 'CEST', name: 'Central European Summer Time', zone: fixed(2), related: 'Berlin' },
  { code: 'EET', name: 'Eastern European Time', zone: fixed(2), related: 'Athens' },
  { code: 'EEST', name: 'Eastern European Summer Time', zone: fixed(3), related: 'Athens' },
  { code: 'MSK', name: 'Moscow Standard Time', zone: fixed(3) },
  { code: 'TRT', name: 'Turkey Time', zone: fixed(3) },

  // Africa
  { code: 'WAT', name: 'West Africa Time', zone: fixed(1) },
  { code: 'CAT', name: 'Central Africa Time', zone: fixed(2) },
  { code: 'SAST', name: 'South Africa Standard Time', zone: fixed(2) },
  { code: 'EAT', name: 'East Africa Time', zone: fixed(3) },

  // Asia
  {
    code: 'GST',
    name: 'Gulf Standard Time',
    zone: fixed(4),
    alsoMeans: [{ name: 'South Georgia Time', offset: -2 * 60 }],
  },
  { code: 'IRST', name: 'Iran Standard Time', zone: fixed(3, 30) },
  { code: 'AFT', name: 'Afghanistan Time', zone: fixed(4, 30) },
  { code: 'PKT', name: 'Pakistan Standard Time', zone: fixed(5) },
  {
    code: 'IST',
    name: 'India Standard Time',
    zone: fixed(5, 30),
    alsoMeans: [
      { name: 'Israel Standard Time', offset: 2 * 60 },
      { name: 'Irish Standard Time', offset: 1 * 60 },
    ],
  },
  { code: 'NPT', name: 'Nepal Time', zone: fixed(5, 45) },
  { code: 'MMT', name: 'Myanmar Time', zone: fixed(6, 30) },
  { code: 'ICT', name: 'Indochina Time', zone: fixed(7) },
  { code: 'WIB', name: 'Western Indonesia Time', zone: fixed(7) },
  { code: 'WITA', name: 'Central Indonesia Time', zone: fixed(8) },
  { code: 'WIT', name: 'Eastern Indonesia Time', zone: fixed(9) },
  { code: 'BJT', name: 'Beijing Time', zone: fixed(8) },
  { code: 'HKT', name: 'Hong Kong Time', zone: fixed(8) },
  { code: 'SGT', name: 'Singapore Time', zone: fixed(8) },
  { code: 'MYT', name: 'Malaysia Time', zone: fixed(8) },
  { code: 'PHT', aliases: ['PHST'], name: 'Philippine Time', zone: fixed(8) },
  { code: 'JST', name: 'Japan Standard Time', zone: fixed(9) },
  { code: 'KST', name: 'Korea Standard Time', zone: fixed(9) },

  // Oceania
  { code: 'AWST', name: 'Australian Western Standard Time', zone: fixed(8) },
  {
    code: 'ACST',
    name: 'Australian Central Standard Time',
    zone: fixed(9, 30),
    related: 'Adelaide',
  },
  {
    code: 'ACDT',
    name: 'Australian Central Daylight Time',
    zone: fixed(10, 30),
    related: 'Adelaide',
  },
  { code: 'AET', name: 'Australian Eastern Time', zone: iana('Australia/Sydney') },
  { code: 'AEST', name: 'Australian Eastern Standard Time', zone: fixed(10), related: 'AET' },
  { code: 'AEDT', name: 'Australian Eastern Daylight Time', zone: fixed(11), related: 'AET' },
  { code: 'ChST', name: 'Chamorro Standard Time', zone: fixed(10) },
  { code: 'NZT', name: 'New Zealand Time', zone: iana('Pacific/Auckland') },
  { code: 'NZST', name: 'New Zealand Standard Time', zone: fixed(12), related: 'NZT' },
  { code: 'NZDT', name: 'New Zealand Daylight Time', zone: fixed(13), related: 'NZT' },
  { code: 'CHAST', name: 'Chatham Standard Time', zone: fixed(12, 45), related: 'Chatham' },
  { code: 'CHADT', name: 'Chatham Daylight Time', zone: fixed(13, 45), related: 'Chatham' },
  { code: 'SST', name: 'Samoa Standard Time', zone: fixed(-11) },

  // Deadlines: the last time zone on Earth to reach a date.
  { code: 'AoE', name: 'Anywhere on Earth', zone: fixed(-12) },
]
