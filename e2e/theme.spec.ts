import { expect, Page, test } from '@playwright/test'

// Light and dark follow the system until the visitor chooses; a choice is
// remembered and applied before the page first paints.
const toggle = (page: Page) => page.getByRole('button', { name: 'Dark mode' })
const pageColour = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor)

const LIGHT = 'rgb(230, 230, 250)' // chart paper #E6E6FA
const DARK = 'rgb(14, 18, 38)' // night page #0E1226

test.describe('following the system', () => {
  test.describe('a light system', () => {
    test.use({ colorScheme: 'light' })

    test('shows the light page, with the switch off', async ({ page }) => {
      await page.goto('/offline')

      expect(await pageColour(page)).toBe(LIGHT)
      await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false')
    })
  })

  test.describe('a dark system', () => {
    test.use({ colorScheme: 'dark' })

    test('shows the dark page, with the switch on', async ({ page }) => {
      await page.goto('/offline')

      expect(await pageColour(page)).toBe(DARK)
      await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true')
    })
  })
})

test.describe('choosing', () => {
  test.use({ colorScheme: 'light' })

  test('the switch turns a light page dark, and back', async ({ page }) => {
    await page.goto('/offline')

    await toggle(page).click()
    expect(await pageColour(page)).toBe(DARK)
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true')

    await toggle(page).click()
    expect(await pageColour(page)).toBe(LIGHT)
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false')
  })

  test('overrides the system: a dark system can be switched to light', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/offline')
    expect(await pageColour(page)).toBe(DARK)

    await toggle(page).click()

    expect(await pageColour(page)).toBe(LIGHT)
  })

  test('is remembered on the next visit', async ({ page }) => {
    await page.goto('/offline')
    await toggle(page).click()

    await page.goto('/regions/nz')

    expect(await pageColour(page)).toBe(DARK)
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true')
  })

  // The inline script applies the choice before anything is painted. Checked
  // from the document itself, ahead of the app's scripts, so a late application
  // (a flash of the wrong theme) would fail.
  test('is applied before the page first paints', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'))
    const seenFirst: (string | null)[] = []
    await page.exposeFunction('record', (value: string | null) =>
      seenFirst.push(value),
    )
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () =>
        (window as unknown as { record: (v: string | null) => void }).record(
          document.documentElement.getAttribute('data-theme'),
        ),
      )
    })

    await page.goto('/offline')

    await expect.poll(() => seenFirst[0]).toBe('dark')
  })

  test('an unknown saved value is ignored and the system decides', async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'purple'))

    await page.goto('/offline')

    expect(await pageColour(page)).toBe(LIGHT)
  })

  test('works on the chart pages too, charts on a framed plate in dark', async ({
    page,
  }) => {
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')

    await toggle(page).click()

    expect(await pageColour(page)).toBe(DARK)
    // The charts cannot be recoloured, so in dark they sit on a plate.
    const plate = await page.evaluate(() => {
      // The plate is the first child of the chart's article, around the image.
      const plate = document
        .querySelector('main img')!
        .closest('article')!.firstElementChild!
      return getComputedStyle(plate).backgroundColor
    })
    expect(plate).toBe('rgb(23, 28, 56)') // #171C38
  })
})
