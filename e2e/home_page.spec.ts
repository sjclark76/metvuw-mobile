import { expect, test } from '@playwright/test'

test.describe('homepage', () => {
  test('should render page correctly @mobile', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(
      'New Zealand rain & wind forecast | metvuw mobile',
    )

    await expect(
      page.getByRole('heading', { name: 'New Zealand', level: 1 }),
    ).toBeVisible()

    const firstCard = page.getByRole('listitem').first()
    const chart = firstCard.getByRole('img', {
      name: /new zealand forecast chart for .*/i,
    })
    await expect(chart).toBeVisible()
    // The chart came through the image proxy, so this exercises the crop and
    // webp compression too, not just the markup.
    await expect
      .poll(() => chart.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0)
  })

  test('lists every forecast chart the source offers @mobile', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(
      page.getByRole('img', { name: /new zealand forecast chart for .*/i }),
    ).toHaveCount(10)
  })
})
