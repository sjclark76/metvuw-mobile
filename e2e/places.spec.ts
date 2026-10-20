import { expect, test } from '@playwright/test'

// The place list is about 800KB, so it must stay out of a page's first load, and
// once it has been loaded the service worker keeps it, so a search works with no
// connection.
test.use({ serviceWorkers: 'allow' })

const PLACES = '/places/places.v1.json'

test.describe('the place list', () => {
  test('is not downloaded when a page loads @mobile', async ({ page }) => {
    const requested: string[] = []
    page.on('request', (request) => requested.push(request.url()))

    await page.goto('/regions/nz')
    await page.waitForSelector('main img')
    await page.waitForTimeout(500)

    expect(requested.filter((url) => url.includes('/places/'))).toEqual([])
  })

  test('is a place list: credited, and large enough to be useful', async ({
    request,
  }) => {
    const response = await request.get(PLACES)

    expect(response.ok()).toBe(true)
    const data = await response.json()
    expect(data.version).toBe(1)
    expect(data.source).toMatch(/GeoNames/)
    expect(data.places.length).toBeGreaterThan(40000)
  })

  test('still loads with no connection once it has been loaded', async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'needs Chromium network emulation')
    await page.goto('/offline')
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) =>
          navigator.serviceWorker.addEventListener('controllerchange', resolve),
        )
      }
    })
    await page.reload()
    // The first search: online, so the worker sees it and keeps it.
    const online = await page.evaluate(async (url) => {
      const response = await fetch(url)
      return (await response.json()).places.length as number
    }, PLACES)
    expect(online).toBeGreaterThan(40000)
    // Kept by the service worker itself, not just by the browser's own cache.
    await expect
      .poll(() =>
        page.evaluate(async (url) => !!(await caches.match(url)), PLACES),
      )
      .toBe(true)

    await context.setOffline(true)
    const offline = await page.evaluate(async (url) => {
      const response = await fetch(url)
      return (await response.json()).places.length as number
    }, PLACES)

    expect(offline).toBe(online)
  })
})
