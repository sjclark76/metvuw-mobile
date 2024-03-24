import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('satellite page', () => {
  // 2
  test('should not have any automatically detectable accessibility issues', async ({
    page,
  }) => {
    await page.goto('/satellite') // 3

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should render page correctly', async ({ page }) => {
    await page.goto('/satellite')

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/metvuw mobile | satellite/)

    await expect(
      page.getByRole('heading', {
        name: /satellite imagery for new zealand/i,
      }),
    ).toBeVisible()

    const firstCard = page.getByRole('listitem').first()

    await expect(
      firstCard.getByRole('img', {
        name: /satellite chart for/i,
      }),
    ).toBeVisible()
  })
})
