import { expect, Page, test } from '@playwright/test'

// "Pin my location", with the browser's location faked: a spot about 3 km north-east
// of Lake Hawea, in Otago.
const HERE = { latitude: -44.59, longitude: 169.285 }

const locate = (page: Page) =>
  page.getByRole('button', { name: 'Pin my location' })
const locateStatus = (page: Page) => page.locator('[data-locate-status]')
const pinNames = (page: Page) => page.getByRole('button', { name: /^Remove / })

test.describe('with location allowed', () => {
  test.use({ geolocation: HERE, permissions: ['geolocation'] })

  test('pins where the visitor is, named after the nearest place @mobile', async ({
    page,
  }) => {
    await page.goto('/pins')

    await locate(page).click()

    await expect(locateStatus(page)).toContainText(
      /^Pinned Near .+ · \d+ km [NESW]{1,2}$/,
    )
    await expect(pinNames(page)).toHaveCount(1)
    await expect(
      page.getByText('Your location ·', { exact: false }),
    ).toBeVisible()
  })

  test('marks it on the chart', async ({ page }) => {
    await page.goto('/pins')
    await locate(page).click()
    await expect(pinNames(page)).toHaveCount(1)

    await page.goto('/regions/nz')

    await expect(page.locator('[data-pin-marker]').first()).toBeVisible()
  })

  test('does not pin the same spot twice', async ({ page }) => {
    await page.goto('/pins')
    await locate(page).click()
    await expect(pinNames(page)).toHaveCount(1)

    await locate(page).click()

    await expect(locateStatus(page)).toHaveText('Already pinned')
    await expect(pinNames(page)).toHaveCount(1)
  })
})

test.describe('with location refused', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'how a refusal is faked differs by browser',
  )
  test.use({ geolocation: HERE, permissions: [] })

  test('says how to turn it on, and pins nothing', async ({ page }) => {
    await page.goto('/pins')

    await locate(page).click()

    await expect(locateStatus(page)).toContainText(
      'Location is turned off for this site',
    )
    await expect(pinNames(page)).toHaveCount(0)
  })
})

test.describe('with no connection', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'needs Chromium network emulation',
  )
  test.use({
    geolocation: HERE,
    permissions: ['geolocation'],
    serviceWorkers: 'allow',
  })

  test('names the spot from the place list kept on the device', async ({
    page,
    context,
  }) => {
    await page.goto('/pins')
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) =>
          navigator.serviceWorker.addEventListener('controllerchange', resolve),
        )
      }
    })
    await page.reload()
    await expect
      .poll(() =>
        page.evaluate(
          async () => !!(await caches.match('/places/places.v1.json')),
        ),
      )
      .toBe(true)

    await context.setOffline(true)
    await locate(page).click()

    await expect(locateStatus(page)).toContainText(/^Pinned Near /)
  })
})
