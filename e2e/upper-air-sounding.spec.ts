import { expect, type Page, test } from '@playwright/test'

// The stub's metvuw upper air charts are from 11–14 Oct 2026, older than any
// balloon the page asks for, so a station with a sounding gets our chart.
const glance = (page: Page) => page.getByRole('region', { name: 'At a glance' })

test.describe('upper air: what the balloon found', () => {
  test("shows the panel and our chart in place of metvuw's @mobile", async ({
    page,
  }) => {
    await page.goto('/upperair/93844')

    await expect(glance(page)).toContainText('Freezing level 970 m')
    await expect(glance(page)).toContainText('Stable: thunderstorms unlikely')
    await expect(
      page.getByRole('img', { name: /Balloon sounding/ }),
    ).toBeVisible()
    await expect(
      page.getByRole('img', { name: /upper air chart for/i }),
    ).toHaveCount(0)
    await expect(
      page.getByRole('slider', { name: 'Chart position' }),
    ).toHaveCount(0)
  })

  test('says where the readings start when the lowest are missing', async ({
    page,
  }) => {
    await page.goto('/upperair/93417')

    await expect(glance(page)).toContainText(
      'No readings below 1,500 m from this balloon',
    )
    await expect(
      page.getByRole('img', { name: /Balloon sounding/ }),
    ).toBeVisible()
  })

  test('is as before when there is no balloon data', async ({ page }) => {
    await page.goto('/upperair/93112')

    await expect(glance(page)).toHaveCount(0)
    await expect(
      page.getByRole('img', { name: /upper air chart for/i }),
    ).toHaveCount(8)
  })
})
