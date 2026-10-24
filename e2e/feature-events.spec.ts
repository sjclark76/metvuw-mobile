import { expect, Page, test } from '@playwright/test'

import { revealFooter } from './footer-helpers'

// Which features are used, counted as Google Analytics events. The tag is faked: it
// keeps what it is sent in session storage (so it survives a reload), and the tests
// read that. Where the events carry details, they are only what was done, never a
// place, a position or the visitor's location.
const WANAKA = {
  name: 'Wanaka',
  context: 'Otago',
  kind: 'Town',
  latitude: -44.703,
  longitude: 169.132,
}

type Sent = { name: string; params?: Record<string, unknown> }

async function fakeTag(page: Page) {
  await page.addInitScript(() => {
    ;(window as unknown as { gtag: unknown }).gtag = (
      _command: string,
      name: string,
      params?: unknown,
    ) => {
      const all = JSON.parse(sessionStorage.getItem('sent') ?? '[]')
      all.push({ name, params })
      sessionStorage.setItem('sent', JSON.stringify(all))
    }
  })
}
const sent = (page: Page) =>
  page.evaluate(
    () => JSON.parse(sessionStorage.getItem('sent') ?? '[]') as Sent[],
  )
const names = async (page: Page) => (await sent(page)).map((e) => e.name)
const count = async (page: Page, name: string) =>
  (await names(page)).filter((n) => n === name).length

async function withPin(page: Page) {
  await page.addInitScript(
    (pin) => localStorage.setItem('pins', JSON.stringify([pin])),
    WANAKA,
  )
}

test.describe('feature events', () => {
  test.beforeEach(async ({ page }) => {
    await fakeTag(page)
  })

  test('counts opening the animated viewer, and playing it @mobile', async ({
    page,
  }) => {
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')
    await revealFooter(page)

    await page.getByLabel('Show animated weather chart').click()
    await page.getByLabel('Play animation').click()

    expect(await names(page)).toEqual(['viewer_opened', 'viewer_played'])
  })

  test('counts using the slider once, however far it is moved @mobile', async ({
    page,
  }) => {
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')
    await revealFooter(page)

    await page.getByRole('slider', { name: 'Chart position' }).focus()
    for (let step = 0; step < 5; step++) await page.keyboard.press('ArrowRight')

    expect(await count(page, 'slider_used')).toBe(1)
  })

  test('counts adding, labelling and removing a pin, without saying which place', async ({
    page,
  }) => {
    await page.goto('/pins')
    await page.getByLabel('Add a place').fill('wanaka')
    await page.getByRole('button', { name: /^Wanaka\s+Town · Otago/ }).click()
    await page.getByRole('button', { name: 'Label Wanaka' }).click()
    await page.getByLabel(/Label for Wanaka/).fill('Home')
    await page.getByRole('button', { name: 'Save' }).click()
    await page.getByRole('button', { name: 'Remove Wanaka' }).click()

    const events = await sent(page)
    expect(events).toEqual([
      { name: 'pin_added', params: { method: 'search' } },
      { name: 'pin_labelled' },
      { name: 'pin_removed' },
    ])
    expect(JSON.stringify(events)).not.toMatch(/Wanaka|Home|Otago|-44|169/)
  })

  test.describe('with a location', () => {
    test.use({
      geolocation: { latitude: -44.59, longitude: 169.285 },
      permissions: ['geolocation'],
    })

    test('counts a pin made from the visitor’s location, without the location', async ({
      page,
    }) => {
      await page.goto('/pins')

      await page.getByRole('button', { name: 'Pin my location' }).click()
      await expect(page.locator('[data-locate-status]')).toContainText('Pinned')

      const events = await sent(page)
      expect(events).toEqual([
        { name: 'pin_added', params: { method: 'location' } },
      ])
      expect(JSON.stringify(events)).not.toMatch(/-44|169|Hawea/)
    })
  })

  test('counts the rain strip: shown once, a pin chosen, a cell tapped @mobile', async ({
    page,
  }) => {
    await withPin(page)
    await page.addInitScript(() =>
      localStorage.setItem(
        'pins',
        JSON.stringify([
          {
            name: 'Wanaka',
            context: 'Otago',
            kind: 'Town',
            latitude: -44.703,
            longitude: 169.132,
          },
          {
            name: 'Auckland',
            context: 'Auckland',
            kind: 'City',
            latitude: -36.848,
            longitude: 174.763,
          },
        ]),
      ),
    )
    await page.goto('/regions/nz')
    await revealFooter(page)
    await expect(page.locator('[data-rain-cell]').first()).toBeVisible()

    await page
      .getByLabel('Pin for the rain strip')
      .selectOption({ label: 'All pins' })
    await page.locator('[data-rain-cell="2"]').first().click()

    const events = await sent(page)
    expect(events.filter((e) => e.name === 'rain_strip_shown')).toHaveLength(1)
    expect(events).toContainEqual({
      name: 'rain_strip_pin_changed',
      params: { all_pins: true },
    })
    expect(events).toContainEqual({
      name: 'rain_strip_cell_tapped',
      params: { all_pins: true },
    })
    expect(JSON.stringify(events)).not.toMatch(/Wanaka|Auckland/)
  })

  // A press before the page has come alive does nothing, so each is repeated until it
  // has opened what it opens (a press that has taken effect is not repeated).
  const opens = async (
    press: () => Promise<void>,
    opened: () => Promise<boolean>,
  ) => {
    await expect(async () => {
      if (!(await opened())) await press()
      expect(await opened()).toBe(true)
    }).toPass()
  }

  test('counts opening the rainfall key, the radar key and the upper air help', async ({
    page,
  }) => {
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')
    await opens(
      () => page.getByRole('button', { name: /rainfall legend/ }).click(),
      () => page.locator('#rainfall-legend').isVisible(),
    )
    await page.goto('/radar/nl')
    await page.waitForSelector('main img')
    await opens(
      () => page.getByRole('button', { name: 'Show radar key' }).click(),
      () => page.getByRole('region', { name: 'Radar key' }).isVisible(),
    )
    await page.goto('/upperair')
    await page.waitForSelector('main img')
    await opens(
      () => page.getByText('What are these charts?').click(),
      () => page.getByText(/Each chart is a tephigram/).isVisible(),
    )

    // The browser announces that a details element has opened a moment after it
    // has, so the last event can arrive just after the text is on screen.
    await expect
      .poll(() => sent(page))
      .toEqual([
        { name: 'key_opened', params: { key: 'rainfall' } },
        { name: 'key_opened', params: { key: 'radar' } },
        { name: 'help_opened', params: { help: 'upper_air' } },
      ])
  })

  test('counts a change of theme', async ({ page }) => {
    await page.goto('/offline')

    await page.getByRole('button', { name: /^Theme:/ }).click()
    await page.getByRole('button', { name: 'Dark', exact: true }).click()

    expect(await sent(page)).toEqual([
      { name: 'theme_changed', params: { theme: 'dark' } },
    ])
  })

  test('counts the refresh button, which then reloads the page @mobile', async ({
    page,
  }) => {
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')

    await Promise.all([
      page.waitForEvent('load'),
      page.getByRole('button', { name: 'Refresh page' }).click(),
    ])

    expect(await count(page, 'refresh_pressed')).toBe(1)
  })

  test('counts a visit from the installed app once, not one from a browser tab', async ({
    page,
    browser,
  }) => {
    await page.goto('/offline')
    expect(await count(page, 'app_opened_installed')).toBe(0)

    const installed = await browser.newPage()
    await fakeTag(installed)
    await installed.addInitScript(() =>
      Object.defineProperty(navigator, 'standalone', { value: true }),
    )
    await installed.goto('/offline')
    await installed.goto('/radar/nl')

    expect(await count(installed, 'app_opened_installed')).toBe(1)
    await installed.close()
  })

  test.describe('saving', () => {
    test.skip(
      ({ browserName }) => browserName !== 'chromium',
      'saving needs a service worker, as in the offline specs',
    )
    test.use({ serviceWorkers: 'allow' })

    test('counts saving a page and removing it', async ({ page }) => {
      await page.goto('/regions/nz')
      await page.waitForSelector('main img')
      await page.evaluate(async () => {
        await navigator.serviceWorker.ready
        if (!navigator.serviceWorker.controller) {
          await new Promise((resolve) =>
            navigator.serviceWorker.addEventListener(
              'controllerchange',
              resolve,
            ),
          )
        }
      })
      await page.reload()
      await page.waitForSelector('main img')
      const button = page.getByRole('button', { name: 'Save for offline' })

      await button.click()
      await expect(button).toHaveAttribute('aria-pressed', 'true', {
        timeout: 30_000,
      })
      await button.click()

      expect(await names(page)).toEqual(['page_saved', 'page_removed'])
    })
  })
})
