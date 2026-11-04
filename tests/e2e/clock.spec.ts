import { expect, type Page, test } from '@playwright/test'

/** Stands in for Akamai's time service, with a clock `offset` milliseconds ahead of ours. */
async function timeServer(page: Page, offset = 0) {
  await page.route('https://time.akamai.com/**', (route) =>
    route.fulfill({
      contentType: 'text/plain',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: ((Date.now() + offset) / 1000).toFixed(3),
    }),
  )
}

/** The instant a clock shows and the offset it shows it at, from its <time> element. */
async function shown(page: Page, index = 0) {
  const datetime = (await page.locator('time.clock').nth(index).getAttribute('datetime')) ?? ''
  return { at: Date.parse(datetime), offset: datetime.slice(-6) }
}

const heading = (page: Page) => page.getByRole('heading', { level: 1 })

/** One of the details below a clock, by its label. */
const fact = (page: Page, label: string) =>
  page.locator('.fact', { has: page.getByText(label, { exact: true }) })

test.describe('addresses', () => {
  test.beforeEach(async ({ page }) => timeServer(page))

  for (const [path, canonical, title, offset] of [
    ['/utc+2', '/UTC+2', 'UTC+2', '+02:00'],
    ['/utc+5:30', '/UTC+5:30', 'UTC+5:30', '+05:30'],
    ['/utc+5.5', '/UTC+5:30', 'UTC+5:30', '+05:30'],
    ['/gmt-3', '/UTC-3', 'UTC\u22123', '-03:00'],
    ['/UTC%E2%88%929:30', '/UTC-9:30', 'UTC\u22129:30', '-09:30'],
  ] as const) {
    test(`${path} shows ${title}`, async ({ page }) => {
      // GitHub Pages answers with 404.html, which is the app.
      const response = await page.goto(path)
      expect(response?.status()).toBe(404)
      await expect(page).toHaveURL(canonical)
      await expect(heading(page)).toHaveText(title)
      const clock = await shown(page)
      expect(clock.offset).toBe(offset)
      expect(Math.abs(clock.at - Date.now())).toBeLessThan(3000)
    })
  }

  test('a city by any spelling', async ({ page }) => {
    await page.goto('/new%20york')
    await expect(page).toHaveURL('/New_York')
    await expect(heading(page)).toHaveText('New York, United States')
    await expect(page).toHaveTitle(/ · New York$/)
  })

  test('an IANA time zone', async ({ page }) => {
    await page.goto('/asia/kolkata')
    await expect(page).toHaveURL('/Asia/Kolkata')
    await expect(heading(page)).toHaveText('Kolkata, India')
    await expect(page.getByText('Asia/Kolkata', { exact: true })).toBeVisible()
    expect((await shown(page)).offset).toBe('+05:30')
  })

  test('the device’s own time zone at the root', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
    await expect(heading(page)).toHaveText('Toronto, Canada')
  })

  test('a way back to the device’s own time zone from any other', async ({ page }) => {
    await page.goto('/')
    const back = page.getByRole('link', { name: 'Your time', exact: true })
    await expect(heading(page)).toHaveText('Toronto, Canada')
    await expect(back).toHaveCount(0)
    await page.goto('/Tokyo,London')
    await expect(back).toHaveAttribute('title', 'Your time zone: Toronto')
    await back.click()
    await expect(page).toHaveURL('/')
    await expect(heading(page)).toHaveText('Toronto, Canada')
    await expect(back).toHaveCount(0)
  })

  test('an address that names no clock', async ({ page }) => {
    await page.goto('/Atlantis')
    await expect(heading(page)).toHaveText('There is no time zone called “Atlantis”.')
    await page.goto('/utc+15')
    await expect(heading(page)).toContainText('is not a UTC offset a clock can show')
  })
})

test.describe('what a clock tells', () => {
  test.beforeEach(async ({ page }) => timeServer(page))

  test('the essentials, and the details on asking, kept open across visits', async ({ page }) => {
    await page.goto('/Tokyo')
    await expect(page.getByText(/^1[34] hours ahead of you$/)).toBeVisible()
    const zone = fact(page, 'Time zone')
    await expect(zone).toHaveCount(0)
    await page.getByText('Details').click()
    await expect(zone).toContainText('Japan Standard Time')
    await expect(zone).toContainText('Asia/Tokyo')
    await expect(fact(page, 'UTC offset')).toContainText('UTC+9')
    await expect(fact(page, 'Week')).toHaveText(/^Week\d{1,2}$/)
    await expect(fact(page, 'Next change')).toContainText('In the coming year')
    // Nothing above says again.
    const date = ((await page.locator('.single-date').textContent()) ?? '').replace(/^\w+, /, '')
    await expect(page.locator('.details')).not.toContainText(date)

    await page.goto('/UTC+5:30')
    const usedIn = fact(page, 'Used in')
    await expect(usedIn).toContainText('India and Sri Lanka')
    await expect(fact(page, 'Next change')).toContainText('A fixed offset')
    await expect(fact(page, 'UTC offset')).toHaveCount(0)
    await page.getByText('Details').click()
    // Closed once the app has taken the toggle, which the browser reports a moment later.
    await expect(usedIn).toHaveCount(0)
    await page.reload()
    await expect(usedIn).toBeHidden()
  })

  test('the next change of the clocks', async ({ page }) => {
    await page.goto('/New_York')
    // Within a week of a change it shows without asking; further off, under Details.
    await page.getByText('Details').click()
    await expect(
      page.getByText(
        /^Clocks go (forward|back) 1 hour .+, to UTC\u2212[45]\.$|^(Forward|Back) 1 hour, to UTC\u2212[45]$/,
      ),
    ).toBeVisible()
  })

  test('what an abbreviation stands for', async ({ page }) => {
    await page.goto('/cst')
    await expect(page).toHaveURL('/CST')
    await expect(page.getByText('Central Standard Time')).toBeVisible()
    await expect(page.getByText(/also stand for China Standard Time \(UTC\+8\)/)).toBeVisible()
    await page.getByRole('link', { name: 'CT (Central Time)' }).click()
    await expect(page).toHaveURL('/CT')
  })

  test('the time zones of a country', async ({ page }) => {
    await page.goto('/usa')
    await expect(page).toHaveURL('/United_States')
    await expect(page.getByText(/^Eastern (Standard|Daylight) Time \(New York\)$/)).toBeVisible()
    await page.getByRole('link', { name: 'Los Angeles' }).click()
    await expect(page).toHaveURL('/Los_Angeles')
    await expect(heading(page)).toHaveText('Los Angeles, United States')
    await page.goBack()
    await expect(heading(page)).toHaveText('United States')
  })
})

test.describe('several clocks', () => {
  test.beforeEach(async ({ page }) => timeServer(page))

  test('shown side by side, and removed one by one', async ({ page }) => {
    await page.goto('/Tokyo,utc,london,Atlantis')
    await expect(page.getByRole('alert')).toHaveText('Could not show “Atlantis”. Remove')
    await page.getByRole('alert').getByRole('button', { name: 'Remove' }).click()
    await expect(page).toHaveURL('/Tokyo,UTC,London')
    await expect(page.locator('.card')).toHaveCount(3)
    expect((await shown(page, 1)).offset).toBe('+00:00')
    await page.getByRole('button', { name: 'Remove London' }).click()
    await expect(page).toHaveURL('/Tokyo,UTC')
    await page.getByRole('button', { name: 'Remove UTC' }).click()
    await expect(page).toHaveURL('/Tokyo')
    await expect(heading(page)).toHaveText('Tokyo, Japan')
  })

  /** Drags a card by its handle to the middle of the card in another place, without letting go. */
  async function dragTo(page: Page, name: string, place: number) {
    const from = await page.getByRole('button', { name: `Move ${name}`, exact: true }).boundingBox()
    const to = await page.locator('.card').nth(place).boundingBox()
    if (!from || !to) throw new Error('No card to drag')
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
    await page.mouse.down()
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 })
  }

  test('rearranged by dragging, the address in step', async ({ page }) => {
    await page.goto('/Tokyo,London,UTC+5:30')
    const titles = page.locator('.card-title')
    await expect(titles).toHaveText(['Tokyo', 'London', 'UTC+5:30'])
    const steps = await page.evaluate(() => history.length)
    await dragTo(page, 'Tokyo', 2)
    // The others make way before the card is let go.
    await expect(titles).toHaveText(['London', 'UTC+5:30', 'Tokyo'])
    await page.mouse.up()
    await expect(page).toHaveURL('/London,UTC+5:30,Tokyo')
    await expect(page.getByRole('status')).toHaveText('Tokyo moved to position 3 of 3')
    await expect(page.locator('.card').nth(2)).not.toHaveClass(/lifted/)
    // Rearranging is no step to go back through.
    expect(await page.evaluate(() => history.length)).toBe(steps)
    await page.reload()
    await expect(titles).toHaveText(['London', 'UTC+5:30', 'Tokyo'])
  })

  test('a drag cancelled with Escape puts the card back', async ({ page }) => {
    await page.goto('/Tokyo,London,UTC+5:30')
    const titles = page.locator('.card-title')
    await dragTo(page, 'UTC+5:30', 0)
    await expect(titles).toHaveText(['UTC+5:30', 'Tokyo', 'London'])
    await page.keyboard.press('Escape')
    await expect(titles).toHaveText(['Tokyo', 'London', 'UTC+5:30'])
    await page.mouse.up()
    await expect(page).toHaveURL('/Tokyo,London,UTC+5:30')
    await expect(page.getByRole('status')).toHaveText('')
  })

  test('rearranged with the arrow keys on a card’s handle', async ({ page }) => {
    await page.goto('/Tokyo,London,UTC+5:30')
    const handle = page.getByRole('button', { name: 'Move Tokyo', exact: true })
    await handle.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page).toHaveURL('/London,Tokyo,UTC+5:30')
    await expect(handle).toBeFocused()
    await expect(page.getByRole('status')).toHaveText('Tokyo moved to position 2 of 3')
    await page.keyboard.press('End')
    await expect(page).toHaveURL('/London,UTC+5:30,Tokyo')
    await expect(handle).toBeFocused()
    // Home moves the card, rather than leading back to your own time zone.
    await page.keyboard.press('Home')
    await expect(page).toHaveURL('/Tokyo,London,UTC+5:30')
    await page.keyboard.press('ArrowUp')
    await expect(page).toHaveURL('/Tokyo,London,UTC+5:30')
    await expect(page.locator('.card-title')).toHaveText(['Tokyo', 'London', 'UTC+5:30'])
    await expect(handle).toBeFocused()
  })
})

test.describe('search', () => {
  test.beforeEach(async ({ page }) => timeServer(page))

  test('shows what is chosen, or adds it', async ({ page }) => {
    await page.goto('/')
    const box = page.getByRole('combobox', { name: 'Find a time zone' })
    await box.fill('tok')
    await expect(page.getByRole('option').first()).toContainText('Tokyo')
    await box.press('Enter')
    await expect(page).toHaveURL('/Tokyo')

    await page.keyboard.press('/')
    await expect(box).toBeFocused()
    await box.fill('london')
    await box.press('Shift+Enter')
    await expect(page).toHaveURL('/Tokyo,London')

    await box.fill('utc+5.5')
    await page.getByRole('button', { name: 'Add UTC+5:30' }).click()
    await expect(page).toHaveURL('/Tokyo,London,UTC+5:30')
    await expect(page.locator('.card')).toHaveCount(3)
  })

  test('says when nothing matches', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('combobox').fill('qqqxz')
    await expect(page.getByText('Nothing matches “qqqxz”.')).toBeVisible()
  })
})

test.describe('keyboard', () => {
  test.beforeEach(async ({ page }) => timeServer(page))

  test('typing anywhere starts a search', async ({ page }) => {
    await page.goto('/UTC')
    const box = page.getByRole('combobox', { name: 'Find a time zone' })
    await page.keyboard.type('tok')
    await expect(box).toBeFocused()
    await expect(box).toHaveValue('tok')
    await expect(page.getByRole('option').first()).toContainText('Tokyo')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL('/Tokyo')
    // Combinations with Ctrl stay the browser's.
    await page.keyboard.press('Control+a')
    await expect(box).not.toBeFocused()
  })

  test('Home leads back to your own time zone', async ({ page }) => {
    await page.goto('/Tokyo,London')
    await page.keyboard.press('Home')
    await expect(page).toHaveURL('/')
    await expect(heading(page)).toHaveText('Toronto, Canada')
  })

  test('? opens the help, whose examples lead to their clocks', async ({ page }) => {
    await page.goto('/')
    const help = page.getByRole('dialog', { name: 'How to use Time' })
    await page.keyboard.press('?')
    await expect(help).toBeVisible()
    // Typing in the help starts no search behind it.
    await page.keyboard.type('x')
    await expect(page.getByRole('combobox')).toHaveValue('')
    await page.keyboard.press('Escape')
    await expect(help).toBeHidden()
    await page.getByRole('button', { name: 'Help' }).click()
    await help.getByRole('link', { name: '/utc+5.5' }).click()
    await expect(help).toBeHidden()
    await expect(page).toHaveURL('/UTC+5:30')
  })
})

test.describe('synchronization', () => {
  test('corrects a clock that is behind, and says so', async ({ page }) => {
    await timeServer(page, 3000)
    await page.goto('/UTC')
    const notice = page.getByText(
      /^Your clock is (2\.9|3\.0)\d+s behind\. The times here are corrected\.$/,
    )
    await expect(notice).toBeVisible()
    await expect(notice).toHaveAttribute('title', 'Synchronized with time.akamai.com')
    await expect
      .poll(async () => (await shown(page)).at - Date.now(), { timeout: 3000 })
      .toBeGreaterThan(1500)
    await page.goto('/Tokyo,London')
    await expect(notice).toBeVisible()
  })

  test('tells of a clock that is right only in the details', async ({ page }) => {
    await timeServer(page)
    await page.goto('/UTC')
    await page.getByText('Details').click()
    await expect(fact(page, 'Your clock')).toContainText(/Exact±0\.\d+s · time\.akamai\.com/)
    await expect(page.locator('.clock-notice')).toHaveCount(0)
  })

  test('falls back on the site’s own Date header', async ({ page }) => {
    await page.route('https://time.akamai.com/**', (route) => route.abort())
    await page.goto('/UTC')
    await page.getByText('Details').click()
    await expect(fact(page, 'Your clock')).toContainText(/^Your clockExact.+ · localhost:4318$/, {
      timeout: 20_000,
    })
  })

  test('says when no time server answers', async ({ page }) => {
    await page.route('https://time.akamai.com/**', (route) => route.abort())
    await page.route('**/*', (route) =>
      route.request().method() === 'HEAD' ? route.abort() : route.fallback(),
    )
    await page.goto('/UTC')
    await expect(page.getByText(/^Could not reach a time server/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  })
})

test.describe('settings', () => {
  test.beforeEach(async ({ page }) => timeServer(page))

  test('a 12-hour clock, without seconds, kept across visits', async ({ page }) => {
    await page.goto('/UTC')
    const clock = page.locator('time.clock')
    const hour24 = page.getByRole('button', { name: '24h' })
    await expect(clock).toHaveText(/^\d{2}:\d{2}:\d{2}$/)
    await expect(hour24).toHaveAttribute('aria-pressed', 'true')
    await hour24.click()
    await expect(clock).toHaveText(/^\d{1,2}:\d{2}:\d{2} (AM|PM)$/)
    await page.getByRole('button', { name: 'Seconds' }).click()
    await expect(clock).toHaveText(/^\d{1,2}:\d{2} (AM|PM)$/)
    await page.reload()
    await expect(clock).toHaveText(/^\d{1,2}:\d{2} (AM|PM)$/)
    await expect(hour24).toHaveAttribute('aria-pressed', 'false')
  })
})

test.describe('theme', () => {
  test.beforeEach(async ({ page }) => timeServer(page))

  const background = (page: Page) =>
    page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)
  const choose = async (page: Page, mode: string) => {
    await page.getByRole('button', { name: 'Theme' }).click()
    await page.locator('.theme-mode', { hasText: mode }).click()
  }

  test('follows the system, or the reader’s choice, from the first paint', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/UTC')
    expect(await background(page)).toBe('rgb(14, 15, 17)')
    await choose(page, 'Light')
    expect(await background(page)).toBe('rgb(246, 246, 244)')
    await page.reload()
    expect(await background(page)).toBe('rgb(246, 246, 244)')
    // Without the app, the script in the page's head alone puts the theme in place.
    await page.route('**/assets/*.js', (route) => route.abort())
    await page.reload()
    await expect(page.locator('main')).toHaveCount(0)
    expect(await background(page)).toBe('rgb(246, 246, 244)')
  })

  test('the reader’s own colours', async ({ page }) => {
    await page.goto('/UTC')
    await choose(page, 'Custom')
    await page.getByLabel('Background').fill('#336699')
    await page.getByLabel('Text').fill('#ffeecc')
    expect(await background(page)).toBe('rgb(51, 102, 153)')
    expect(
      await page.locator('time.clock').evaluate((clock) => getComputedStyle(clock).color),
    ).toBe('rgb(255, 238, 204)')
    // A dark background of the reader's own takes the browser's controls dark too.
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(
      'dark',
    )
    await page.reload()
    expect(await background(page)).toBe('rgb(51, 102, 153)')
    await choose(page, 'Auto')
    expect(await background(page)).toBe('rgb(246, 246, 244)')
  })
})

test('credits its author, its license, its source and what it includes', async ({ page }) => {
  await timeServer(page)
  await page.goto('/')
  const footer = page.locator('footer')
  await expect(footer).toHaveText(
    /^© 2026(–\d{4})? K4YT3X·Released under the MIT License·Source on GitHub$/,
  )
  for (const [name, href] of [
    ['K4YT3X', 'https://github.com/k4yt3x'],
    ['MIT License', 'https://github.com/k4yt3x/time/blob/master/LICENSE'],
    ['Source on GitHub', 'https://github.com/k4yt3x/time'],
  ] as const) {
    await expect(footer.getByRole('link', { name, exact: true })).toHaveAttribute('href', href)
  }
  await expect(page.locator('.brand').getByRole('link', { name: 'K4YT3X' })).toHaveAttribute(
    'href',
    'https://github.com/k4yt3x',
  )
  const licenses = await page.request.get('/licenses.md')
  expect(licenses.status()).toBe(200)
  expect(await licenses.text()).toContain('preact')
})

test('runs within its content security policy, without errors', async ({ page }) => {
  await timeServer(page)
  const errors: string[] = []
  page.on('console', (message) => {
    // Chromium reports loading a page answered with status 404, which every clock's address is.
    if (message.type() === 'error' && !/status of 404/.test(message.text())) {
      errors.push(message.text())
    }
  })
  page.on('pageerror', (error) => errors.push(error.message))
  for (const path of ['/', '/UTC+5:30', '/Tokyo,London,EST', '/United_States', '/Atlantis']) {
    await page.goto(path)
    await expect(page.locator('main')).not.toBeEmpty()
  }
  expect(errors).toEqual([])
})
