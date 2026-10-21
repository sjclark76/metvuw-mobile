import { expect, Page, test } from '@playwright/test'

// An installed app that is switched away from is suspended and shown as it was when
// opened again. After half an hour away, coming back fetches the page's data again.
// The clock is faked, so the half hour passes at once.
const HALF_HOUR = 30 * 60 * 1000

async function comeBack(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    })
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

const pageDataRequests = (page: Page) => {
  const seen: string[] = []
  page.on('request', (request) => {
    if (
      request.headers()['rsc'] === '1' &&
      new URL(request.url()).pathname === '/regions/nz'
    ) {
      seen.push(request.url())
    }
  })
  return seen
}

test.describe('coming back to the app', () => {
  test('fetches the page again after a long time away @mobile', async ({
    page,
  }) => {
    await page.clock.install()
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')
    const requests = pageDataRequests(page)

    await page.clock.fastForward(HALF_HOUR + 60_000)
    await comeBack(page)

    await expect.poll(() => requests.length).toBeGreaterThan(0)
  })

  test('does not fetch again after a short time away', async ({ page }) => {
    await page.clock.install()
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')
    const requests = pageDataRequests(page)

    await page.clock.fastForward(5 * 60_000)
    await comeBack(page)
    await page.waitForTimeout(500)

    expect(requests).toHaveLength(0)
  })
})

test('the refresh button is there on a phone @mobile', async ({ page }) => {
  await page.goto('/regions/nz')

  await expect(page.getByRole('button', { name: 'Refresh page' })).toBeVisible()
})
