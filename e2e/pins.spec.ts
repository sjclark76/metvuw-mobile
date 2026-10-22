import { expect, Page, test } from '@playwright/test'

import { openMenu } from './menu-helpers'

// Pinning a place: search for it, see it marked on the charts, label it, remove it.
// Wanaka is at 44.703S 169.132E; on the NZ chart that is 47.79% across and 68.71%
// down the chart image (worked out apart from the app, from the chart calibration).
test.use({ serviceWorkers: 'allow' })

const addPlace = (page: Page) => page.getByLabel('Add a place')
const markers = (page: Page) => page.locator('[data-pin-marker]')

async function pinWanaka(page: Page) {
  await page.goto('/pins')
  await addPlace(page).fill('wanaka')
  await page.getByRole('button', { name: /^Wanaka\s+Town · Otago/ }).click()
  await expect(page.getByRole('status')).toContainText('Pinned Wanaka')
}

test.describe('pinning a place', () => {
  test('finds a place by name and pins it @mobile', async ({ page }) => {
    await page.goto('/pins')

    await addPlace(page).fill('mt cook')
    await expect(
      page.getByRole('list', { name: 'Matching places' }),
    ).toContainText('Aoraki / Mount Cook')

    await addPlace(page).fill('wanaka')
    await page.getByRole('button', { name: /^Wanaka\s+Town · Otago/ }).click()

    await expect(page.getByRole('status')).toContainText('Pinned Wanaka')
    await expect(
      page.getByRole('button', { name: 'Remove Wanaka' }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'South Island' }),
    ).toHaveAttribute('href', '/regions/nzsi')
  })

  test('credits GeoNames on the page @mobile', async ({ page }) => {
    await page.goto('/pins')

    await expect(page.getByText(/GeoNames/)).toBeVisible()
  })

  test('marks the place on the chart, at the right spot @mobile', async ({
    page,
  }) => {
    await pinWanaka(page)

    await page.goto('/regions/nz')
    await page.waitForSelector('main img')

    const marker = markers(page).first()
    await expect(marker).toBeVisible()
    const left = parseFloat(
      (await marker.getAttribute('style'))!.match(/left:\s*([\d.]+)%/)![1],
    )
    const top = parseFloat(
      (await marker.getAttribute('style'))!.match(/top:\s*([\d.]+)%/)![1],
    )
    expect(left).toBeCloseTo(47.79, 0)
    expect(top).toBeCloseTo(68.71, 0)
    await expect(marker).toContainText('Wanaka')
  })

  test('draws the dot over the chart image, not beside it @mobile', async ({
    page,
  }) => {
    await pinWanaka(page)
    await page.goto('/regions/nz')
    const chart = page.locator('main img').first()
    const dot = markers(page).first().locator('[data-pin-dot]')
    // Both are drawn only once the page is running; measure them when they are.
    await expect(chart).toBeVisible()
    await expect(dot).toBeVisible()

    const image = (await chart.boundingBox())!
    const ring = (await dot.boundingBox())!

    expect(ring.x + ring.width / 2).toBeGreaterThan(
      image.x + image.width * 0.45,
    )
    expect(ring.x + ring.width / 2).toBeLessThan(image.x + image.width * 0.5)
    expect(ring.y + ring.height / 2).toBeGreaterThan(
      image.y + image.height * 0.66,
    )
    expect(ring.y + ring.height / 2).toBeLessThan(image.y + image.height * 0.71)
  })

  test('marks it on the home page, which is the NZ chart @mobile', async ({
    page,
  }) => {
    await pinWanaka(page)

    await page.goto('/')
    await page.waitForSelector('main img')

    await expect(markers(page).first()).toBeVisible()
  })

  test('marks nothing on a chart that does not show the place @mobile', async ({
    page,
  }) => {
    await pinWanaka(page)

    await page.goto('/regions/europe')
    await page.waitForSelector('main img')
    await page.waitForTimeout(300)

    await expect(markers(page)).toHaveCount(0)
  })

  test('is still pinned after a reload', async ({ page }) => {
    await pinWanaka(page)

    await page.reload()

    await expect(
      page.getByRole('button', { name: 'Remove Wanaka' }),
    ).toBeVisible()
  })

  test('shows a label on the chart instead of the name, and the full name on the page @mobile', async ({
    page,
  }) => {
    await pinWanaka(page)

    await page.getByRole('button', { name: 'Label Wanaka' }).click()
    await page.getByLabel(/Label for Wanaka on the charts/).fill('Home')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Home')).toBeVisible()
    await expect(page.getByText('Wanaka').first()).toBeVisible()

    await page.goto('/regions/nz')
    await page.waitForSelector('main img')
    await expect(markers(page).first()).toContainText('Home')
    await expect(markers(page).first()).not.toContainText('Wanaka')
  })

  test('removes the marker when the pin is removed', async ({ page }) => {
    await pinWanaka(page)
    await page.getByRole('button', { name: 'Remove Wanaka' }).click()
    await expect(page.getByText(/No pins yet/)).toBeVisible()

    await page.goto('/regions/nz')
    await page.waitForSelector('main img')
    await page.waitForTimeout(300)

    await expect(markers(page)).toHaveCount(0)
  })

  test('is reached from the menu, which counts the pins @mobile', async ({
    page,
  }) => {
    await pinWanaka(page)
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')

    await openMenu(page)
    await page.getByRole('link', { name: 'Pins (1)' }).click()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pins')
  })

  test('does not move the charts when the markers appear @mobile', async ({
    page,
  }) => {
    await pinWanaka(page)
    await page.addInitScript(() => {
      const samples: number[] = []
      ;(window as unknown as { samples: number[] }).samples = samples
      const sample = () => {
        const list = document
          .querySelector('[data-chart-index="0"]')
          ?.closest('ul')
        const top = list
          ? Math.round(list.getBoundingClientRect().top + scrollY)
          : 0
        if (top > 0) samples.push(top)
        requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
    })

    await page.goto('/regions/nz')
    await expect(markers(page).first()).toBeVisible()
    await page.waitForTimeout(500)

    const samples = await page.evaluate(
      () => (window as unknown as { samples: number[] }).samples,
    )
    expect(samples.length).toBeGreaterThan(5)
    expect(new Set(samples).size).toBe(1)
  })
})

test.describe('with no connection', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'needs Chromium network emulation',
  )

  async function controlled(page: Page) {
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) =>
          navigator.serviceWorker.addEventListener('controllerchange', resolve),
        )
      }
    })
    await page.reload()
    await page.waitForSelector('main img')
  }

  // The Pins page is never visited online here: it opens because saving a page kept it
  // (as visiting it would also have let the browser keep it, and prove nothing).
  test('the Pins page opens, with its pins, once a page has been saved, though it was never visited', async ({
    page,
    context,
  }) => {
    await controlled(page)
    await page.getByRole('button', { name: 'Save for offline' }).click()
    await expect(page.getByText(/^Saved · /)).toBeVisible({ timeout: 30_000 })
    await page.evaluate(() =>
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
        ]),
      ),
    )

    await context.setOffline(true)
    await page.goto('/pins')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pins')
    await expect(
      page.getByRole('button', { name: 'Remove Wanaka' }),
    ).toBeVisible()
  })

  test('a place can be searched for offline after the Pins page has been opened online', async ({
    page,
    context,
  }) => {
    await controlled(page)
    await page.getByRole('button', { name: 'Save for offline' }).click()
    await expect(page.getByText(/^Saved · /)).toBeVisible({ timeout: 30_000 })
    await page.goto('/pins')
    // Opening the page loads the list of places, which the worker keeps.
    await expect
      .poll(() =>
        page.evaluate(
          async () => !!(await caches.match('/places/places.v1.json')),
        ),
      )
      .toBe(true)

    await context.setOffline(true)
    await page.goto('/pins')
    await addPlace(page).fill('queenstown')

    await expect(
      page.getByRole('list', { name: 'Matching places' }),
    ).toContainText('Queenstown')
  })
})
