import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('homepage', () => {
  test('should render page correctly', async ({ page }) => {
    await page.goto('/')

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/metvuw mobile | nz/)

    await expect(
      page.getByRole('heading', {
        name: /forecast issued at .* for new zealand/i,
      }),
    ).toBeVisible()

    const firstCard = page.getByRole('listitem').first()

    await expect(
      firstCard.getByRole('img', {
        name: /new zealand forecast chart for .*/i,
      }),
    ).toBeVisible()

    // const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    //
    // expect(accessibilityScanResults.violations).toEqual([])
  })
})
