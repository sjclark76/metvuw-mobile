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
    await expect(alerts(page)).toContainText(
      /Strong Wind Watch at Christchurch: until [A-Z][a-z]{2} \d{1,2}:\d{2}(am|pm)/,
    )
    const link = alerts(page)
      .getByRole('link', { name: /On MetService/ })
      .first()
    await expect(link).toHaveAttribute(
      'href',
      'https://metservice.com/warnings/home',
    )
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(alerts(page)).toContainText(
      'Alerts from MetService, licensed CC BY 4.0; areas simplified.',
    )
  })

  // The alert is already under way, so its map is for now: past all of the
  // stub's charts (from 15 Oct), which is the last of the ten.
  test('opens the map for the time of the alert @mobile', async ({ page }) => {
    await pin(page, christchurch)
    await page.goto('/regions/nz')

    await alerts(page)
      .getByRole('button', { name: /^Map for / })
      .first()
      .click()

    await expect(
      page.getByRole('slider', { name: 'Chart position' }),
    ).toHaveAttribute('aria-valuetext', 'Chart 10 of 10')
  })

  test('shows the worse alert first', async ({ page }) => {
    await pin(page, christchurch)

    await page.goto('/regions/nz')

    const blocks = alerts(page).getByRole('listitem')
    await expect(blocks).toHaveCount(2)
    await expect(blocks.nth(0)).toContainText('Strong Wind Watch')
    await expect(blocks.nth(1)).toContainText('Heavy Rain Watch')
  })

  // Two alerts share a row where there is room, and stack on a phone.
  test('puts two alerts side by side on a wide screen', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await pin(page, christchurch)

    await page.goto('/regions/nz')

    const blocks = alerts(page).getByRole('listitem')
    await expect(blocks).toHaveCount(2)
    const first = (await blocks.nth(0).boundingBox())!
    const second = (await blocks.nth(1).boundingBox())!
    expect(second.y).toBe(first.y)
    expect(second.x).toBeGreaterThan(first.x + first.width - 1)
    expect(second.height).toBe(first.height)
  })

  test('stacks two alerts on a phone @mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await pin(page, christchurch)

    await page.goto('/regions/nz')

    const blocks = alerts(page).getByRole('listitem')
    await expect(blocks).toHaveCount(2)
    const first = (await blocks.nth(0).boundingBox())!
    const second = (await blocks.nth(1).boundingBox())!
    expect(second.x).toBe(first.x)
    expect(second.y).toBeGreaterThanOrEqual(first.y + first.height)
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
    // Hydration and the charts' requests are done: the hook has had its chance.
    await page.waitForLoadState('networkidle')

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
