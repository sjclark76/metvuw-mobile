import type { Page } from '@playwright/test'

/**
 * On a phone the footer is out of sight until the top of a chart page has scrolled
 * off (see FooterControl/useFooterShown). This scrolls just far enough for that,
 * so the first chart is still the one in view. On a wide screen it changes nothing.
 */
export async function revealFooter(page: Page) {
  // The page may still be arriving.
  await page
    .locator('[data-page-top-end]')
    .waitFor({ state: 'attached' })
    .catch(() => undefined)
  // And the charts drawn, or the page moves under the scroll.
  await page
    .locator('[data-chart-index="0"]')
    .first()
    .waitFor({ state: 'attached' })
    .catch(() => undefined)
  await page
    .waitForFunction(
      () => {
        const image = document.querySelector<HTMLImageElement>(
          '[data-chart-index="0"] img',
        )
        return !image || image.complete
      },
      undefined,
      { timeout: 3000 },
    )
    .catch(() => undefined)
  await page.evaluate(() => {
    const end = document.querySelector('[data-page-top-end]')
    if (end) window.scrollTo(0, end.getBoundingClientRect().top + scrollY - 63)
  })
}
