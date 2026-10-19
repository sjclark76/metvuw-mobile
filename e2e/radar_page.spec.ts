import { expect, test } from '@playwright/test'

test.describe('radar page', () => {
  test('should render page correctly @mobile', async ({ page }) => {
    await page.goto('/radar/nl')

    await expect(page).toHaveTitle('metvuw mobile | Radar')

    await expect(
      page.getByRole('heading', {
        name: /radar chart for northland/i,
      }),
    ).toBeVisible()

    const charts = page.getByRole('img', { name: /radar chart for/i })
    await expect(charts).toHaveCount(3)
    await expect
      .poll(() =>
        charts.first().evaluate((img: HTMLImageElement) => img.naturalWidth),
      )
      .toBeGreaterThan(0)
  })

  test('shows only the radar that was asked for @mobile', async ({ page }) => {
    await page.goto('/radar/ak')

    await expect(
      page.getByRole('heading', { name: /radar chart for auckland/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('img', { name: /radar chart for/i }),
    ).toHaveCount(3)
  })
})
