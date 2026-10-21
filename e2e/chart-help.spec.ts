import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

// Help for reading the charts: under the rainfall key on the forecast pages, and a
// "What are these charts?" on the upper air pages.
test.describe('how to read the forecast chart', () => {
  test('is under the rain key @mobile', async ({ page }) => {
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')

    await page.getByRole('button', { name: 'Show rainfall legend' }).click()

    const help = page.getByRole('region', { name: 'How to read this chart' })
    await expect(help).toBeVisible()
    await expect(help).toContainText('A short feather is 5 knots')
    await expect(help).toContainText('air pressure in hPa')
    await expect(help).toContainText('rain in the last 6 hours, in mm')
  })

  test('fits on the screen above the footer, with nothing cut off @mobile', async ({
    page,
  }) => {
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')
    await page.getByRole('button', { name: 'Show rainfall legend' }).click()

    const help = page.getByRole('region', { name: 'How to read this chart' })
    await expect(help).toBeVisible()
    const panel = page.locator('#rainfall-legend')
    const fits = await panel.evaluate(
      (element) => element.scrollHeight <= element.clientHeight,
    )
    expect(fits).toBe(true)
    const box = (await panel.boundingBox())!
    const footer = (await page.locator('footer').boundingBox())!
    expect(box.y + box.height).toBeLessThanOrEqual(footer.y)
  })

  test('has no accessibility violations with the key open', async ({
    page,
  }) => {
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')
    await page.getByRole('button', { name: 'Show rainfall legend' }).click()
    await expect(
      page.getByRole('region', { name: 'How to read this chart' }),
    ).toBeVisible()
    await page.evaluate(() =>
      Promise.all(
        document.getAnimations().map((animation) => animation.finished),
      ),
    )

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()

    expect(results.violations).toEqual([])
  })
})

test.describe('what the upper air charts are', () => {
  test('is closed until it is opened @mobile', async ({ page }) => {
    await page.goto('/upperair')
    await page.waitForSelector('main img')
    const summary = page.getByText('What are these charts?')
    const text = page.getByText(/Each chart is a tephigram/)
    await expect(summary).toBeVisible()
    await expect(text).toBeHidden()

    await summary.click()

    await expect(text).toBeVisible()
    await expect(page.getByText(/Weather balloons carry/)).toContainText(
      '11am and 11pm New Zealand time',
    )
  })

  test('opens with the keyboard', async ({ page }) => {
    await page.goto('/upperair')
    await page.waitForSelector('main img')

    await page.getByText('What are these charts?').focus()
    await page.keyboard.press('Enter')

    await expect(page.getByText(/Each chart is a tephigram/)).toBeVisible()
  })

  test('has no accessibility violations when open', async ({ page }) => {
    await page.goto('/upperair')
    await page.waitForSelector('main img')
    await page.getByText('What are these charts?').click()
    await page.evaluate(() =>
      Promise.all(
        document.getAnimations().map((animation) => animation.finished),
      ),
    )

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()

    expect(results.violations).toEqual([])
  })
})
