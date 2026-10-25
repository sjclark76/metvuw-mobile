import { expect, Page, test } from '@playwright/test'

// Service workers only exist in the production build.
test.use({ serviceWorkers: 'allow' })

// Chromium is the engine that applies offline emulation to the worker's traffic.
test.skip(
  ({ browserName }) => browserName !== 'chromium',
  'needs Chromium network emulation',
)

async function openControlled(page: Page, path = '/satellite') {
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
}

const waitingWorker = (page: Page) =>
  page.evaluate(
    async () => !!(await navigator.serviceWorker.getRegistration())?.waiting,
  )

test.describe('service worker', () => {
  test('the build generates a worker that registers and controls the page', async ({
    page,
  }) => {
    await openControlled(page)

    const script = await page.evaluate(
      () => navigator.serviceWorker.controller?.scriptURL,
    )
    expect(script).toMatch(/\/sw\.js$/)
  })

  test('precaches the offline page, which shows when the network is gone', async ({
    page,
    context,
  }) => {
    await openControlled(page)
    await context.setOffline(true)

    await page.goto('/regions/nz').catch(() => {})

    await expect(page.getByText("You're Offline")).toBeVisible()
  })

  test('the offline page reloads the page you wanted once you are back online', async ({
    page,
    context,
  }) => {
    await openControlled(page)
    await context.setOffline(true)
    await page.goto('/regions/nz').catch(() => {})
    await expect(page.getByText("You're Offline")).toBeVisible()

    await context.setOffline(false)

    await expect(page.getByText("You're Offline")).toBeHidden()
    await expect(page).toHaveURL(/\/regions\/nz$/)
    await page.waitForSelector('main img')
  })

  // Charts are kept as they are seen, but the page around them is not: it would
  // point at the files of the build it came from (see offline-unsaved.spec.ts).
  test('charts already viewed are kept, though the page is the offline page until it is saved', async ({
    page,
    context,
  }) => {
    await openControlled(page)
    // The first visit's images load before the worker controls the page.
    await page.reload()
    // Charts below the fold load lazily, so the first one is the one to wait for.
    await page.waitForFunction(() => {
      const img = document.querySelector('main img') as HTMLImageElement | null
      return !!img && img.complete && img.naturalWidth > 0
    })
    expect(
      await page.evaluate(
        async () => (await (await caches.open('chart-images')).keys()).length,
      ),
    ).toBeGreaterThan(0)

    await context.setOffline(true)
    await page.reload()

    await expect(page.getByText("You're Offline")).toBeVisible()
  })

  test('coming back online does not reload the page', async ({
    page,
    context,
  }) => {
    await openControlled(page)
    await page.evaluate(() => Object.assign(window, { stillHere: true }))

    await context.setOffline(true)
    await context.setOffline(false)
    await page.waitForTimeout(1500)

    expect(
      await page.evaluate(() => (window as { stillHere?: boolean }).stillHere),
    ).toBe(true)
  })
})

test.describe('updates', () => {
  // Playwright cannot change what the browser's own update check fetches, so a
  // deploy is simulated by registering the same worker under a new URL: for the
  // same scope that is an update, with the browser's real waiting lifecycle.
  const deploy = (page: Page) =>
    page.evaluate(async () => {
      await navigator.serviceWorker.register('/sw.js?deploy=2', { scope: '/' })
    })

  test('a new version waits for the visitor instead of taking over', async ({
    page,
  }) => {
    await openControlled(page)
    await page.evaluate(() => Object.assign(window, { stillHere: true }))

    await deploy(page)

    await expect(page.getByRole('status')).toContainText('new version')
    expect(await waitingWorker(page)).toBe(true)
    await page.waitForTimeout(1000)
    expect(
      await page.evaluate(() => (window as { stillHere?: boolean }).stillHere),
    ).toBe(true)
  })

  test('Reload activates it and reloads the page', async ({ page }) => {
    await openControlled(page)
    await page.evaluate(() => Object.assign(window, { stillHere: true }))
    await deploy(page)

    await Promise.all([
      page.waitForEvent('load'),
      page.getByRole('button', { name: 'Reload' }).click(),
    ])

    expect(
      await page.evaluate(() => (window as { stillHere?: boolean }).stillHere),
    ).toBeUndefined()
    await page.waitForSelector('main img')
    // The new worker now controls the page. (The reloaded page registers the
    // original URL again, so a worker may wait afterwards: that is an artefact
    // of simulating a deploy with a second URL, which a real deploy does not have.)
    expect(
      await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL),
    ).toMatch(/deploy=2$/)
    await expect(page.getByRole('status')).toBeHidden()
  })

  test('Later dismisses the notice and keeps the page as it is', async ({
    page,
  }) => {
    await openControlled(page)
    await deploy(page)

    await page.getByRole('button', { name: 'Later' }).click()

    await expect(page.getByRole('status')).toBeHidden()
    expect(await waitingWorker(page)).toBe(true)
  })
})
