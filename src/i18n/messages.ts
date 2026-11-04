/**
 * Everything the interface says, as one catalogue per language. Values that go into a sentence
 * arrive already formatted for the locale (durations, dates, offsets), so a catalogue only
 * arranges words.
 */
export interface Messages {
  siteName: string
  /** Before the author's name, as in "by K4YT3X". */
  by: string

  searchLabel: string
  searchPlaceholder: string
  searchHint: string
  noMatches: (query: string) => string
  addClock: (name: string) => string
  removeClock: (name: string) => string
  moveClock: (name: string) => string
  /** How to move a clock, on its handle. */
  moveClockHint: string
  /** Told to screen readers once a clock is moved: its name and its place now. */
  clockMoved: (name: string, position: number, count: number) => string

  yourTime: string
  yourTimeZone: (place: string) => string
  hour24: string
  hour24Short: string
  seconds: string
  fullscreen: string
  help: string
  close: string
  theme: string
  themeAuto: string
  themeLight: string
  themeDark: string
  themeCustom: string
  colorBackground: string
  colorText: string
  colorAccent: string
  exitFullscreen: string

  placeInCountry: (place: string, country: string) => string
  coordinatedUniversalTime: string
  /** A day such as Tomorrow before a date. */
  dayAndDate: (day: string, date: string) => string
  aheadOfYou: (duration: string) => string
  behindYou: (duration: string) => string
  sameTimeAsYou: string
  yesterday: string
  today: string
  tomorrow: string
  zoneOfCity: (zone: string, city: string) => string
  /** A change of the clocks within the week; `when` is one of the phrases below. */
  clocksGoForward: (amount: string, when: string, offset: string) => string
  clocksGoBack: (amount: string, when: string, offset: string) => string
  todayAt: (time: string) => string
  tomorrowAt: (time: string) => string
  onWeekdayAt: (weekday: string, time: string) => string
  severalZones: (country: string) => string
  alsoMeans: (meanings: string) => string
  seeAlso: string

  details: string
  /** The labels of the details. */
  weekLabel: string
  offsetLabel: string
  zoneLabel: string
  nextChangeLabel: string
  yourClockLabel: string
  usedInLabel: string
  none: string
  fixedOffset: string
  inTheComingYear: string
  forward: (amount: string, offset: string) => string
  back: (amount: string, offset: string) => string
  andMore: (count: number) => string
  tzdbVersion: (version: string) => string

  checking: string
  exact: string
  ahead: (amount: string) => string
  behind: (amount: string) => string
  /** How sure, and whose time: "±0.006s · time.akamai.com". */
  clockPrecision: (uncertainty: string, source: string) => string
  clockAheadNotice: (amount: string) => string
  clockBehindNotice: (amount: string) => string
  syncedWith: (source: string) => string
  syncFailed: string
  retry: string

  unknownPlace: (input: string) => string
  invalidOffset: (input: string) => string
  unsupportedZone: (input: string) => string
  didYouMean: string
  whatWorks: string
  couldNotShow: (inputs: string) => string
  removeThem: string

  copyright: (years: string) => string
  /** Before the licence's name, as in "Released under the MIT License". */
  releasedUnder: string
  helpTitle: string
  helpAddresses: string
  helpAddressesIntro: string
  helpOffsets: string
  helpAbbreviations: string
  helpCities: string
  helpRegions: string
  helpZones: string
  helpSeveral: string
  helpOffsetsNote: string
  helpSearch: string
  helpSearchText: string
  helpKeyboard: string
  keyStartSearch: string
  keyFocusSearch: string
  keyMove: string
  keyShow: string
  keyAdd: string
  keyEscape: string
  keyHome: string
  keyReorder: string
  keyHelp: string
  keyFullscreen: string
  helpAccuracy: string
  helpAccuracyText: string

  license: string
  /** Before GitHub, as in "Source on GitHub". */
  sourceOn: string
}
