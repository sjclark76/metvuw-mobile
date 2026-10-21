import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

// The key to the radar's colours, from a button above the footer.
test.describe('the radar key', () => {
  test('opens and closes from its button @mobile', async ({ page }) => {
    await page.goto('/radar/nl')
    await page.waitForSelector('main img')
    const key = page.getByRole('region', { name: 'Radar key' })
    await expect(key).toBeHidden()

    await page.getByRole('button', { name: 'Show radar key' }).click()

    await expect(key).toBeVisible()
    await expect(key).toContainText('Radar echoes (dBZ)')
    await expect(key).toContainText('Heavy')
    await expect(key).toContainText('Medium')
    await expect(key).toContainText('Light')
    await expect(key.locator('[data-radar-band]')).toHaveCount(12)

    await page.getByRole('button', { name: 'Hide radar key' }).click()

    await expect(key).toBeHidden()
  })

  test('fits above the footer, with nothing cut off @mobile', async ({
    page,
  }) => {
    await page.goto('/radar/nl')
    await page.waitForSelector('main img')
    await page.getByRole('button', { name: 'Show radar key' }).click()

    const key = page.getByRole('region', { name: 'Radar key' })
    await expect(key).toBeVisible()
    const fits = await key.evaluate(
      (element) => element.scrollHeight <= element.clientHeight,
    )
    expect(fits).toBe(true)
    const box = (await key.boundingBox())!
    const footer = (await page.locator('footer').boundingBox())!
    expect(box.y + box.height).toBeLessThanOrEqual(footer.y)
  })

  test('is not on the forecast pages, which have their own key', async ({
    page,
  }) => {
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')

    await expect(
      page.getByRole('button', { name: 'Show radar key' }),
    ).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Show rainfall legend' }),
    ).toBeVisible()
  })

  test('has no accessibility violations with the key open', async ({
    page,
  }) => {
    await page.goto('/radar/nl')
    await page.waitForSelector('main img')
    await page.getByRole('button', { name: 'Show radar key' }).click()
    await expect(page.getByRole('region', { name: 'Radar key' })).toBeVisible()
    await page.evaluate(() =>
      Promise.all(
        document.getAnimations().map((animation) => animation.finished),
      ),
    )

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()

    expect(results.violations).toEqual([])
  })
})
