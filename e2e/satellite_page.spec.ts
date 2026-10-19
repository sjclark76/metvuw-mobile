import { expect, test } from '@playwright/test'

test.describe('satellite page', () => {
  test('should render page correctly @mobile', async ({ page }) => {
    await page.goto('/satellite')

    await expect(page).toHaveTitle('metvuw mobile | Satellite')

    await expect(
      page.getByRole('heading', {
        name: /satellite imagery for new zealand/i,
      }),
    ).toBeVisible()

    const charts = page.getByRole('img', { name: /satellite chart for/i })
    await expect(charts).toHaveCount(4)
    await expect
      .poll(() =>
        charts.first().evaluate((img: HTMLImageElement) => img.naturalWidth),
      )
      .toBeGreaterThan(0)
  })
})
