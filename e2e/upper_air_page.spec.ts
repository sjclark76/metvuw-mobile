import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('upper air page', () => {
  // 2
  test('should not have any automatically detectable accessibility issues', async ({
    page,
  }) => {
    await page.goto('/upperair/93112')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should render page correctly', async ({ page }) => {
    await page.goto('/upperair/93112') // 3

    await expect(page).toHaveTitle(/metvuw mobile | upper air/)

    await expect(
      page.getByRole('heading', {
        name: /upper air chart for whenuapai/i,
      }),
    ).toBeVisible()

    const firstCard = page.getByRole('listitem').first()

    await expect(
      firstCard.getByRole('img', {
        name: /upper air chart for/i,
      }),
    ).toBeVisible()
  })
})
