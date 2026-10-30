import { expect, type Page, type Request, test } from '@playwright/test'

// MetService's alerts for a pin, above the heavy rain heads-up. The stub has one
// wind watch, around Christchurch (see e2e/stub/metvuw-stub.mjs).
const christchurch = {
  name: 'Christchurch',
  context: 'Canterbury',
  kind: 'City',
  latitude: -43.532,
  longitude: 172.637,
}
const auckland = {
  name: 'Auckland',
  context: 'Auckland',
  kind: 'City',
  latitude: -36.848,
  longitude: 174.763,
}

async function pin(page: Page, ...pins: object[]) {
  await page.addInitScript(
    (value) => localStorage.setItem('pins', JSON.stringify(value)),
    pins,
  )
}
const alerts = (page: Page) =>
  page.getByRole('region', { name: 'Weather alerts' })

test.describe('MetService alerts for a pin', () => {
  test('shows the alert for a pin inside its area, linked to MetService @mobile', async ({
    page,
  }) => {
    await pin(page, christchurch)

    await page.goto('/regions/nz')

    await expect(alerts(page)).toBeVisible()
    const link = alerts(page).getByRole('link', {
      name: /Strong Wind Watch at Christchurch: until/,
    })
    await expect(link).toHaveAttribute(
      'href',
      'https://metservice.com/warnings/home',
    )
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(alerts(page)).toContainText(
      'Alerts from MetService, licensed CC BY 4.0; areas simplified.',
    )
  })

  test('shows the alert above what the charts say', async ({ page }) => {
    await pin(page, christchurch)

    await page.goto('/regions/nz')

    const slot = page.locator('[data-heavy-rain-slot]')
    await expect(alerts(page)).toBeVisible()
    const alertsTop = (await alerts(page).boundingBox())!.y
    const rainTop = (await slot.getByRole('status').boundingBox())!.y
    expect(alertsTop).toBeLessThan(rainTop)
  })

  test('shows no alert for a pin outside its area', async ({ page }) => {
    await pin(page, auckland)
    const answered = page.waitForResponse(/\/api\/warnings$/)

    await page.goto('/regions/nz')
    await answered

    await expect(page.locator('[data-heavy-rain-slot]')).toBeVisible()
    await expect(alerts(page)).toHaveCount(0)
  })

  test('shows no alert when weather warnings are off in Settings', async ({
    page,
  }) => {
    const urls: string[] = []
    page.on('request', (request) => urls.push(request.url()))
    await pin(page, christchurch)
    await page.addInitScript(() =>
      localStorage.setItem('showHeavyRain', 'false'),
    )

    await page.goto('/regions/nz')
    await page.waitForSelector('main img')

    expect(urls.filter((url) => /\/api\/warnings/.test(url))).toEqual([])
    await expect(alerts(page)).toHaveCount(0)
    await expect(page.locator('[data-heavy-rain-slot]')).toBeHidden()
  })

  test('asks the server for the alerts, not MetService, and sends it nothing of the pins', async ({
    page,
  }) => {
    const requests: Request[] = []
    page.on('request', (request) => requests.push(request))
    await pin(page, christchurch)

    await page.goto('/regions/nz')
    await expect(alerts(page)).toBeVisible()

    const asked = requests.filter((request) =>
      /\/api\/warnings|metservice\.com/.test(request.url()),
    )
    expect(asked.map((request) => request.url())).toEqual([
      expect.stringMatching(/\/api\/warnings$/),
    ])
    expect(asked[0].method()).toBe('GET')
    expect(asked[0].postData()).toBeNull()
  })
})
