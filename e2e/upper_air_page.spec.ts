import { expect, test } from '@playwright/test'

test.describe('upper air page', () => {
  test('should render page correctly @mobile', async ({ page }) => {
    await page.goto('/upperair/93112')

    await expect(page).toHaveTitle('metvuw mobile | Upper Air Data')

    await expect(
      page.getByRole('heading', {
        name: /upper air chart for whenuapai/i,
      }),
    ).toBeVisible()

    const charts = page.getByRole('img', { name: /upper air chart for/i })
    await expect(charts).toHaveCount(3)
    await expect
      .poll(() =>
        charts.first().evaluate((img: HTMLImageElement) => img.naturalWidth),
      )
      .toBeGreaterThan(0)
  })

  test('starts at the default station when none is given @mobile', async ({
    page,
  }) => {
    await page.goto('/upperair')

    await expect(
      page.getByRole('heading', { name: /upper air chart for whenuapai/i }),
    ).toBeVisible()
  })

  test('shows another station when asked @mobile', async ({ page }) => {
    await page.goto('/upperair/93844')

    await expect(
      page.getByRole('heading', { name: /upper air chart for invercargill/i }),
    ).toBeVisible()
  })
})
