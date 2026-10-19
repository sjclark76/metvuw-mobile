import { expect, test } from '@playwright/test'

// People who raise their text size (the iOS setting, or a browser's zoom) make
// every rem-based size larger on the same narrow screen. The header's buttons
// must stay on the one row beside the name, not drop onto a second row.
test.describe('the header at larger text sizes @mobile', () => {
  for (const percent of [100, 130, 160, 200]) {
    test(`keeps its buttons on one row at ${percent}% text`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 664 })
      await page.goto('/offline')
      await page.addStyleTag({
        content: `html{font-size:${percent}% !important}`,
      })

      const centres = await page.evaluate(() =>
        [
          document.querySelector('nav a[href="/"]'),
          ...document.querySelectorAll('nav button[aria-label]'),
        ].map((el) => {
          const box = el!.getBoundingClientRect()
          return Math.round(box.top + box.height / 2)
        }),
      )
      const buttons = centres.slice(1)
      expect(buttons.length).toBeGreaterThanOrEqual(3)
      // The buttons are centred on the same line as the name; none is on a row below.
      expect(Math.max(...buttons) - Math.min(...buttons)).toBeLessThanOrEqual(2)
      expect(Math.max(...buttons)).toBeLessThan(centres[0] + 40)
    })

    // At large sizes the name is hidden to make room, so the link is named
    // directly rather than by its text.
    test(`still names the home link at ${percent}% text`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 664 })
      await page.goto('/offline')
      await page.addStyleTag({
        content: `html{font-size:${percent}% !important}`,
      })

      await expect(
        page.getByRole('link', { name: 'MetVuw Mobile home' }),
      ).toBeVisible()
    })

    test(`has no sideways scrolling at ${percent}% text`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 664 })
      await page.goto('/offline')
      await page.addStyleTag({
        content: `html{font-size:${percent}% !important}`,
      })

      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        ),
      ).toBeLessThanOrEqual(0)
    })
  }
})
