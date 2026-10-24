import { expect, test } from '@playwright/test'

// On a small screen the footer is out of sight while the top of a chart page is
// showing, so the first screen is mostly chart, and comes in once it has gone.
const footer = (page: import('@playwright/test').Page) =>
  page.locator('[data-footer]')
const scrollTo = (page: import('@playwright/test').Page, y: number) =>
  page.evaluate((top) => window.scrollTo(0, top), y)

test.describe('the footer on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('is out of sight at the top of the page @mobile', async ({ page }) => {
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')

    await expect(footer(page)).toBeHidden()
  })

  test('comes in once the top has scrolled off, and goes when it is back @mobile', async ({
    page,
  }) => {
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')

    await scrollTo(page, 600)
    await expect(footer(page)).toBeVisible()
    // It slides up from below the screen, so wait for it to arrive.
    await expect
      .poll(async () => {
        const box = (await footer(page).boundingBox())!
        return Math.round(box.y + box.height)
      })
      .toBe(844)

    await scrollTo(page, 0)
    await expect(footer(page)).toBeHidden()
  })

  test('stays when the animated viewer is open', async ({ page }) => {
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')
    await scrollTo(page, 600)
    await page
      .getByRole('button', { name: 'Show animated weather chart' })
      .click()

    await scrollTo(page, 0)

    await expect(footer(page)).toBeVisible()
  })

  test('cannot be tabbed to while it is out of sight', async ({ page }) => {
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')

    await expect(
      page.getByRole('button', { name: 'Show animated weather chart' }),
    ).toHaveCount(0)
  })
})

test.describe('the footer on a big screen', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('is there from the top', async ({ page }) => {
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')

    await expect(footer(page)).toBeVisible()
  })
})
