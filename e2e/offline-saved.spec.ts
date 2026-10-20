import { expect, Page, test } from '@playwright/test'

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
  ) as Promise<{ path: string; refreshedAt: number; urls: string[] }[]>

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

test.describe('saving a page', () => {
  test('keeps every chart and the page, and says how big', async ({ page }) => {
    await openControlled(page)

    await save(page)

    await expect(saveButton(page)).toHaveAttribute('aria-pressed', 'true')
    await expect(status(page)).toContainText(/Saved, \d+(\.\d)? [KM]B/)
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
    expect(saved.path).toBe('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'New Zealand',
    )
    await expect(notice(page)).toContainText('Charts saved')
    await expect.poll(() => firstChartLoaded(page)).toBeGreaterThan(0)
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
      ;(window as unknown as { samples: number[] }).samples = samples
      const sample = () => {
        const list = document
          .querySelector('[data-chart-index="0"]')
          ?.closest('ul')
        // At first the list sits inside the loading placeholder, with no position.
        const top = list
          ? Math.round(list.getBoundingClientRect().top + scrollY)
          : 0
        if (top > 0) samples.push(top)
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
    expect(samples.length).toBeGreaterThan(5)
    expect(new Set(samples).size).toBe(1)
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
