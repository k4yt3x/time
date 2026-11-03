/**
 * Regenerates src/data/tzdb.json from a release of the IANA time zone database.
 *
 *   npm run tzdb            the latest release
 *   npm run tzdb -- 2026f   a given release
 *
 * The browser supplies every zone's rules. This file supplies what the browser cannot: which
 * names exist, which names are old spellings of others, which country each zone is in, and the
 * countries' names.
 */
import { writeFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'

const sources = [
  'africa',
  'antarctica',
  'asia',
  'australasia',
  'europe',
  'northamerica',
  'southamerica',
  'etcetera',
  'backward',
]

const output = new URL('../src/data/tzdb.json', import.meta.url)

interface Tzdb {
  version: string
  zones: string[]
  links: Record<string, string>
  renames: Record<string, string>
  zoneTab: [string, string, string][]
  countries: Record<string, string>
}

async function download(release: string | undefined): Promise<Map<string, string>> {
  const url = release
    ? `https://data.iana.org/time-zones/releases/tzdata${release}.tar.gz`
    : 'https://data.iana.org/time-zones/tzdata-latest.tar.gz'
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
  return untar(gunzipSync(new Uint8Array(await response.arrayBuffer())))
}

/** The regular files of a ustar archive, by name. */
function untar(archive: Uint8Array): Map<string, string> {
  const files = new Map<string, string>()
  const decoder = new TextDecoder()
  const field = (header: Uint8Array, start: number, end: number) =>
    decoder.decode(header.subarray(start, end)).replace(/\0.*$/s, '')
  let offset = 0
  while (offset + 512 <= archive.length) {
    const header = archive.subarray(offset, offset + 512)
    if (header.every((byte) => byte === 0)) break
    const name = field(header, 0, 100)
    const size = Number.parseInt(field(header, 124, 136).trim() || '0', 8)
    const type = field(header, 156, 157)
    const start = offset + 512
    if (type === '0' || type === '') {
      files.set(name, decoder.decode(archive.subarray(start, start + size)))
    }
    offset = start + Math.ceil(size / 512) * 512
  }
  return files
}

function parse(files: Map<string, string>): Tzdb {
  const read = (name: string) => {
    const text = files.get(name)
    if (text === undefined) throw new Error(`The archive has no ${name}`)
    return text
  }

  const zones = new Set<string>()
  const links: Record<string, string> = {}
  for (const source of sources) {
    for (const line of read(source).split('\n')) {
      const fields = line.replace(/#.*/, '').trim().split(/\s+/)
      if (fields[0] === 'Zone' && fields[1]) zones.add(fields[1])
      if (fields[0] === 'Link' && fields[1] && fields[2]) links[fields[2]] = fields[1]
    }
  }

  // The sections of `backward` that list other names for a place's own zone (Calcutta for
  // Kolkata), as opposed to places merged into a zone with the same rules (Montreal into
  // Toronto). A "#= NAME" comment names the place a link stands for where tzdb links it on to
  // that place's zone instead (Chungking is Chongqing, whose zone is Shanghai's).
  const renameSections = [
    '# Two-part names that were renamed mostly to three-part names in 1995',
    '# Alternate names for the same location',
  ]
  const renames: Record<string, string> = {}
  let section: 'outside' | 'header' | 'links' = 'outside'
  for (const line of read('backward').split('\n')) {
    if (renameSections.some((header) => line.startsWith(header))) {
      section = 'header'
      continue
    }
    if (section === 'outside') continue
    const link = /^Link\s+(\S+)\s+(\S+)(?:\s+#=\s*(\S+))?/.exec(line)
    if (link?.[1] && link[2]) {
      renames[link[2]] = link[3] ?? link[1]
      section = 'links'
    } else if (section === 'links' && line.trim() === '') {
      section = 'outside'
    }
  }
  for (const header of renameSections) {
    if (!read('backward').includes(header)) throw new Error(`backward has no "${header}"`)
  }

  const rows = (name: string) =>
    read(name)
      .split('\n')
      .filter((line) => line.trim() !== '' && !line.startsWith('#'))
      .map((line) => line.split('\t'))

  const zoneTab = rows('zone.tab').map(([country, , zone, comment]): [string, string, string] => [
    country ?? '',
    zone ?? '',
    comment ?? '',
  ])
  const countries = Object.fromEntries(rows('iso3166.tab').map(([code, name]) => [code, name]))

  const tzdb: Tzdb = {
    version: read('version').trim(),
    zones: [...zones].sort(),
    links: Object.fromEntries(Object.entries(links).sort(([a], [b]) => a.localeCompare(b))),
    renames: Object.fromEntries(Object.entries(renames).sort(([a], [b]) => a.localeCompare(b))),
    zoneTab,
    countries,
  }
  check(tzdb)
  return tzdb
}

function check(tzdb: Tzdb): void {
  const known = (name: string) => tzdb.zones.includes(name) || name in tzdb.links
  for (const [link, target] of Object.entries(tzdb.links)) {
    if (!tzdb.zones.includes(target)) throw new Error(`${link} links to ${target}, not a zone`)
  }
  for (const [old, name] of Object.entries(tzdb.renames)) {
    if (!known(old) || !known(name)) throw new Error(`Unknown rename ${old} -> ${name}`)
  }
  for (const [country, zone] of tzdb.zoneTab) {
    if (!known(zone)) throw new Error(`zone.tab lists ${zone}, which is not a zone or link`)
    if (!country || !(country in tzdb.countries)) {
      throw new Error(`zone.tab lists ${zone} in ${country}, which iso3166.tab lacks`)
    }
  }
}

/** JSON with one entry per line, so a new release's diff shows what changed. */
function serialize(tzdb: Tzdb): string {
  const list = (items: string[]) => items.map((item) => `    ${item}`).join(',\n')
  const record = (entries: Record<string, string>) =>
    list(
      Object.entries(entries).map(
        ([key, value]) => `${JSON.stringify(key)}: ${JSON.stringify(value)}`,
      ),
    )
  return `{
  "version": ${JSON.stringify(tzdb.version)},
  "zones": [
${list(tzdb.zones.map((zone) => JSON.stringify(zone)))}
  ],
  "links": {
${record(tzdb.links)}
  },
  "renames": {
${record(tzdb.renames)}
  },
  "zoneTab": [
${list(tzdb.zoneTab.map((row) => JSON.stringify(row)))}
  ],
  "countries": {
${record(tzdb.countries)}
  }
}
`
}

const tzdb = parse(await download(process.argv[2]))
writeFileSync(output, serialize(tzdb))
console.error(
  `tzdata ${tzdb.version}: ${tzdb.zones.length} zones, ${Object.keys(tzdb.links).length} links, ` +
    `${tzdb.zoneTab.length} zone.tab rows`,
)
