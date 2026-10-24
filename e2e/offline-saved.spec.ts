import { expect, Page, test } from '@playwright/test'

import { openGroup, openMenu } from './menu-helpers'

// Charts the visitor saves must open with no connection at all, as they were
// saved, and be replaced by the newest as soon as there is one.

// Service workers only exist in the production build.
test.use({ serviceWorkers: 'allow' })

// Chromium is the engine that applies offline emulation to the worker's traffic.
test.skip(
  ({ browserName }) => browserName !== 'chromium',
  'needs Chromium network emulation',
)

const saveButton = (page: Page) =>
  page.getByRole('button', { name: 'Save for offline' })
const status = (page: Page) => page.locator('main [role="status"]').first()
const notice = (page: Page) => page.getByText("You're offline.").locator('..')
const offlinePage = (page: Page) =>
  page.getByRole('heading', { name: "You're offline" })

async function openControlled(page: Page, path = '/regions/nz') {
  await page.goto(path)
  await page.waitForSelector('main img')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', resolve),
      )
    }
  })
  // The worker only handles what loads after it took control.
  await page.reload()
  await page.waitForSelector('main img')
}

async function save(page: Page) {
  await saveButton(page).click()
  await expect(status(page)).toContainText('Saved', { timeout: 30_000 })
}

const savedPages = (page: Page) =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem('savedPages') ?? '[]'),
  ) as Promise<
    { path: string; aliases: string[]; refreshedAt: number; urls: string[] }[]
  >

const cacheSize = (page: Page, name: string) =>
  page.evaluate(
    async (cache) => (await (await caches.open(cache)).keys()).length,
    name,
  )

const firstChartLoaded = (page: Page) =>
  page.evaluate(
    () =>
      (document.querySelector('main img') as HTMLImageElement | null)
        ?.naturalWidth ?? 0,
  )

// On a small phone the message beside the button has little room: it must be read
// in full, not cut off with an ellipsis.
test.describe('on a small phone', () => {
  test.use({ viewport: { width: 360, height: 740 } })

  test('the message beside the save button fits', async ({ page }) => {
    await openControlled(page)

    await save(page)

    await expect(status(page)).toContainText(/Issued .+ ago/)
    const fits = await status(page).evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    )
    expect(fits).toBe(true)
  })
})

test.describe('saving a page', () => {
  // The stub's forecast was issued on a fixed day in the past, so it is out of date.
  test('keeps every chart and the page, and says whether it is the newest forecast', async ({
    page,
  }) => {
    await openControlled(page)

    await save(page)

    await expect(saveButton(page)).toHaveAttribute('aria-pressed', 'true')
    await expect(status(page)).toContainText(/^Saved · Issued .+ ago/)
    await page.goto('/saved')
    await expect(page.locator('[data-freshness]').first()).toContainText(
      /issued .+ ago/i,
    )
    const [saved] = await savedPages(page)
    expect(saved.path).toBe('/regions/nz')
    expect(await cacheSize(page, 'saved-charts')).toBe(saved.urls.length)
    expect(await cacheSize(page, 'saved-charts')).toBeGreaterThan(1)
  })

  test('works from the home page, which is the New Zealand forecast', async ({
    page,
    context,
  }) => {
    await openControlled(page, '/')

    await save(page)
    await context.setOffline(true)
    await page.reload()

    const [saved] = await savedPages(page)
    expect(saved.path).toBe('/regions/nz')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'New Zealand',
    )
    await expect(notice(page)).toContainText('Charts saved')
    await expect.poll(() => firstChartLoaded(page)).toBeGreaterThan(0)
  })

  test('saved from the home page, it is saved at the New Zealand page too', async ({
    page,
    context,
  }) => {
    await openControlled(page, '/')
    await save(page)

    // Marked in the menu...
    await openMenu(page)
    await openGroup(page, 'New Zealand')
    await expect(
      page.getByRole('link', { name: 'New Zealand Saved for offline' }),
    ).toBeVisible()
    // ...shown as saved on the New Zealand page itself...
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')
    await expect(saveButton(page)).toHaveAttribute('aria-pressed', 'true')
    // ...and it opens at either address with no connection.
    await context.setOffline(true)
    for (const path of ['/', '/regions/nz']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'New Zealand',
      )
      await expect(notice(page)).toContainText('Charts saved')
    }
  })

  test('marks the saved page in the menu, and counts it @mobile', async ({
    page,
  }) => {
    await openControlled(page)
    await save(page)

    await openMenu(page)
    await openGroup(page, 'New Zealand')

    await expect(
      page.getByRole('link', { name: 'New Zealand Saved for offline' }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'North Island', exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Saved (1)' })).toBeVisible()
  })

  test('pressing it again forgets the page and its charts', async ({
    page,
  }) => {
    await openControlled(page)
    await save(page)

    await saveButton(page).click()

    await expect(saveButton(page)).toHaveAttribute('aria-pressed', 'false')
    await expect.poll(() => cacheSize(page, 'saved-charts')).toBe(0)
    expect(await savedPages(page)).toEqual([])
  })

  test('cannot be saved with no connection, and says why', async ({
    page,
    context,
  }) => {
    await openControlled(page)

    await context.setOffline(true)

    await expect(saveButton(page)).toBeDisabled()
    await expect(status(page)).toContainText('Connect to save this page')
  })

  test('does not move the charts when the button arrives @mobile', async ({
    page,
  }) => {
    // Where the list of charts starts on the page, on every frame from the first
    // until the button has been drawn. (The list, not a chart: charts slide in.)
    await page.addInitScript(() => {
      const samples: number[] = []
      // When the list moves: what is above it, and how tall each part is, so a
      // failure says what changed.
      const moves: unknown[] = []
      const w = window as unknown as { samples: number[]; moves: unknown[] }
      w.samples = samples
      w.moves = moves
      const describeAbove = (list: Element) => {
        const parts: string[] = []
        for (
          let node: Element | null = list;
          node && node.tagName !== 'BODY';
          node = node.parentElement
        ) {
          for (
            let sibling = node.previousElementSibling;
            sibling;
            sibling = sibling.previousElementSibling
          ) {
            parts.push(
              `${sibling.tagName.toLowerCase()}.${String(sibling.className).split(' ')[0]}:${Math.round(sibling.getBoundingClientRect().height)}`,
            )
          }
        }
        return parts
      }
      let last = 0
      let fontFrames = 0
      const sample = () => {
        const list = document
          .querySelector('[data-chart-index="0"]')
          ?.closest('ul')
        // At first the list sits inside the loading placeholder, with no position.
        // Not while the web fonts are still arriving: the title is set in the
        // fallback font until they do, and may be a line taller in it. That is a
        // different move from the one this is about.
        // A frame after they are in, when the page has been laid out with them.
        fontFrames = document.fonts.status === 'loaded' ? fontFrames + 1 : 0
        const settled = fontFrames > 1
        const top =
          list && settled
            ? Math.round(list.getBoundingClientRect().top + scrollY)
            : 0
        if (top > 0) {
          samples.push(top)
          if (last > 0 && top !== last && list) {
            moves.push({
              from: last,
              to: top,
              at: Math.round(performance.now()),
              above: describeAbove(list),
            })
          }
          last = top
        }
        requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
    })

    await page.goto('/regions/nz')
    await expect(saveButton(page)).toBeVisible()
    await page.waitForTimeout(500)

    const samples = await page.evaluate(
      () => (window as unknown as { samples: number[] }).samples,
    )
    const moves = await page.evaluate(
      () => (window as unknown as { moves: unknown[] }).moves,
    )
    expect(samples.length).toBeGreaterThan(5)
    expect(
      new Set(samples).size,
      `the list of charts moved: ${JSON.stringify(moves)}`,
    ).toBe(1)
  })
})

test.describe('opening a saved page with no connection', () => {
  test('shows the page, its charts and how old they are', async ({
    page,
    context,
  }) => {
    await openControlled(page)
    await save(page)

    await context.setOffline(true)
    await page.reload()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'New Zealand',
    )
    await expect(notice(page)).toContainText('Charts saved')
    await expect(notice(page)).toContainText('Forecast issued')
    await expect.poll(() => firstChartLoaded(page)).toBeGreaterThan(0)
  })

  test('takes the charts from what was saved, not what was merely viewed', async ({
    page,
    context,
  }) => {
    await openControlled(page)
    await save(page)
    await page.evaluate(() => caches.delete('chart-images'))

    await context.setOffline(true)
    await page.reload()

    await expect.poll(() => firstChartLoaded(page)).toBeGreaterThan(0)
  })

  test('opens a saved page even when it was never otherwise cached', async ({
    page,
    context,
  }) => {
    await openControlled(page)
    await save(page)
    // Everything the worker kept of its own accord; only what was saved is left.
    await page.evaluate(async () => {
      for (const name of await caches.keys()) {
        if (
          !name.startsWith('saved-') &&
          !name.startsWith('serwist-precache')
        ) {
          await caches.delete(name)
        }
      }
    })

    await context.setOffline(true)
    await page.goto('/regions/nz')

    await expect(offlinePage(page)).toBeHidden()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'New Zealand',
    )
    await expect.poll(() => firstChartLoaded(page)).toBeGreaterThan(0)
  })

  test('a page that was not saved still shows the offline page', async ({
    page,
    context,
  }) => {
    await openControlled(page)
    await save(page)

    await context.setOffline(true)
    await page.goto('/regions/nzsi').catch(() => {})

    await expect(offlinePage(page)).toBeVisible()
  })

  test('the list of saved pages opens too, and leads back to them', async ({
    page,
    context,
  }) => {
    await openControlled(page)
    await save(page)

    await context.setOffline(true)
    await page.goto('/saved')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Saved pages',
    )
    await page.getByRole('link', { name: 'New Zealand' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'New Zealand',
    )
  })
})

test.describe('a visitor who chooses their own home page', () => {
  const homeButton = (page: Page) =>
    page.getByLabel('Use this page as my home page')

  test('with none, saving New Zealand covers the home page as well', async ({
    page,
  }) => {
    await openControlled(page, '/regions/nz')
    await save(page)

    expect((await savedPages(page))[0].aliases).toEqual(['/'])
  })

  test('with another, the home page is not New Zealand, so it is not covered', async ({
    page,
  }) => {
    await page.goto('/regions/nzsi')
    await homeButton(page).click()
    await expect(homeButton(page)).toHaveAttribute('aria-pressed', 'true')

    await openControlled(page, '/regions/nz')
    await save(page)

    const [saved] = await savedPages(page)
    expect(saved.path).toBe('/regions/nz')
    expect(saved.aliases).toEqual([])
  })

  test('choosing another home page after saving stops it covering the home page', async ({
    page,
  }) => {
    await openControlled(page, '/')
    await save(page)
    expect((await savedPages(page))[0].aliases).toEqual(['/'])

    await page.goto('/regions/nzsi')
    await homeButton(page).click()
    await expect(homeButton(page)).toHaveAttribute('aria-pressed', 'true')
    // The next time the app opens, what is saved is checked again.
    await page.goto('/regions/nz')

    await expect
      .poll(async () => (await savedPages(page))[0].aliases)
      .toEqual([])
  })

  test('clearing it again brings the home page back', async ({ page }) => {
    await page.goto('/regions/nzsi')
    await homeButton(page).click()
    await expect(homeButton(page)).toHaveAttribute('aria-pressed', 'true')
    await openControlled(page, '/regions/nz')
    await save(page)
    expect((await savedPages(page))[0].aliases).toEqual([])

    await page.goto('/regions/nzsi')
    await homeButton(page).click()
    await expect(homeButton(page)).toHaveAttribute('aria-pressed', 'false')
    await page.goto('/regions/nz')

    await expect
      .poll(async () => (await savedPages(page))[0].aliases)
      .toEqual(['/'])
  })
})

test.describe('the list of saved pages', () => {
  test('shows what is saved and removes it', async ({ page }) => {
    await openControlled(page)
    await save(page)

    await page.goto('/saved')
    await expect(page.getByRole('link', { name: 'New Zealand' })).toBeVisible()
    await page.getByRole('button', { name: 'Remove New Zealand' }).click()

    await expect(page.getByText(/Nothing is saved yet/)).toBeVisible()
    await expect.poll(() => cacheSize(page, 'saved-charts')).toBe(0)
  })

  test('says how to save a page when there are none', async ({ page }) => {
    await page.goto('/saved')

    await expect(
      page.getByText(/Open a chart page and choose Save for offline/),
    ).toBeVisible()
  })
})

test.describe('keeping saved pages current', () => {
  test('refreshes a saved page as soon as the connection comes back', async ({
    page,
    context,
  }) => {
    await openControlled(page)
    await save(page)
    await context.setOffline(true)
    // As if it was last confirmed long ago.
    await page.evaluate(() => {
      const pages = JSON.parse(localStorage.getItem('savedPages')!)
      pages[0].refreshedAt = 1
      localStorage.setItem('savedPages', JSON.stringify(pages))
    })
    await page.reload()
    expect((await savedPages(page))[0].refreshedAt).toBe(1)

    await context.setOffline(false)

    await expect
      .poll(async () => (await savedPages(page))[0]?.refreshedAt)
      .toBeGreaterThan(Date.now() - 60_000)
    // Brought up to date, not deleted for being old: refreshing comes first.
    expect((await savedPages(page)).map((p) => p.path)).toEqual(['/regions/nz'])
  })

  test('drops a page that has gone a week and cannot be refreshed', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      if (localStorage.getItem('savedPages')) return
      localStorage.setItem(
        'savedPages',
        JSON.stringify([
          {
            path: '/regions/atlantis',
            title: 'Atlantis',
            issued: 1,
            refreshedAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
            urls: ['/api/fallback-image?url=x&chartType=Rain'],
            bytes: 10,
          },
        ]),
      )
    })

    await page.goto('/regions/nz')

    await expect.poll(() => savedPages(page)).toEqual([])
  })

  test('keeps a page that is only a few days old when it cannot be refreshed', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      if (localStorage.getItem('savedPages')) return
      localStorage.setItem(
        'savedPages',
        JSON.stringify([
          {
            path: '/regions/atlantis',
            title: 'Atlantis',
            issued: 1,
            refreshedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
            urls: ['/api/fallback-image?url=x&chartType=Rain'],
            bytes: 10,
          },
        ]),
      )
    })

    await page.goto('/regions/nz')
    await page.waitForSelector('main img')
    await page.waitForTimeout(1500)

    expect((await savedPages(page)).map((p) => p.path)).toEqual([
      '/regions/atlantis',
    ])
  })
})
