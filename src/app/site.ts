/** Who makes the site, and where its source is. */

export const author = { name: 'K4YT3X', url: 'https://github.com/k4yt3x' }

export const repository = `${author.url}/time`

/** The year the site was first published. */
export const firstYear = 2026

/** The years of the copyright: the first, or from the first to `year`, such as "2026–2027". */
export function copyrightYears(year: number): string {
  return year > firstYear ? `${firstYear}\u2013${year}` : String(firstYear)
}
