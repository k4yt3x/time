# Time

A static site that shows the exact time in any time zone, city or UTC offset, at
[time.k4yt3x.com](https://time.k4yt3x.com).

<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/screenshots/dark.png" />
  <img
    alt="Time showing Tokyo, Japan at 10:08:30, tomorrow for the reader, 14 hours ahead of them"
    src=".github/screenshots/light.png"
  />
</picture>

## Addresses

The path names the clocks to show, several separated by commas, such as
`/Tokyo,London,UTC+5:30`. The root shows your own time zone.

| Kind              | Examples                                 |
| ----------------- | ---------------------------------------- |
| UTC offset        | `/utc+2` `/utc+5:30` `/utc+5.5` `/gmt-3` |
| Abbreviation      | `/EST` `/PT` `/CEST` `/AoE`              |
| City              | `/Tokyo` `/New_York` `/nyc`              |
| Country or region | `/Japan` `/USA` `/California`            |
| IANA time zone    | `/Asia/Tokyo` `/Etc/GMT+3`               |

Offsets run from UTC−12 to UTC+14 in whole minutes; `5.5` is 5:30 and `5.75` is 5:45.
Abbreviations for standard or daylight time (`EST`, `CEST`) are fixed offsets; generic ones (`ET`,
`PT`) follow daylight saving time.

## Keyboard

Typing anywhere on the page starts a search. `/` goes to the search box, `Home` back to your own
time zone, and `?` opens the help, which shows all this in the site itself. Full screen is the
browser's own (`F11`) or the button in the header.

## Accuracy

The clock does not trust the device's. It reads [Akamai's time service](https://time.akamai.com/?ms)
a few times and works out the device's error the way NTP does, to within a few milliseconds.
Where that service cannot be reached, it falls back on the `Date` header of the site's own
server, which has whole seconds only, timing its requests to narrow the error to about the
network round trip. It measures again every 30 minutes, and at once when the device's clock jumps.

## Development

Node 26 or later.

```sh
npm install
npm run dev        # development server
npm run check      # lint, typecheck, unit tests
npm run test:e2e   # end-to-end tests in Chromium and Firefox, against the production build
npm run build      # dist/
npm run preview    # serve dist/ as GitHub Pages would, on port 4318
```

Set `CHROMIUM_PATH` to use a system Chromium where Playwright's own build is not installed.

Time zone rules come from the browser. The names of zones, their countries and old names come
from the IANA time zone database, extracted into `src/data/tzdb.json`. To update it to a new
release, run `npm run tzdb` (or `npm run tzdb -- 2026f` for a given one) and commit the result.

## License

[MIT](LICENSE). The build lists the licenses of the libraries and fonts it includes in
`licenses.md`, served at `/licenses.md`.
