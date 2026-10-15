import { expect, test } from '@playwright/test'

test.describe('radar page', () => {
  test('should render page correctly', async ({ page }) => {
    await page.goto('/radar/nl') // 3

    await expect(page).toHaveTitle(/metvuw mobile | radar/)

    await expect(
      page.getByRole('heading', {
        name: /radar chart for northland/i,
      }),
    ).toBeVisible()

    const firstCard = page.getByRole('listitem').first()

    await expect(
      firstCard.getByRole('img', {
        name: /radar chart for/i,
      }),
    ).toBeVisible()
  })
})
