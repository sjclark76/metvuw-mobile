import { expect, Page, test } from '@playwright/test'

import { revealFooter } from './footer-helpers'

// Four satellite charts, one second apart when playing.
const slider = (page: Page) => page.getByLabel('Chart position')

async function openViewer(page: Page) {
  await page.goto('/satellite')
  await revealFooter(page)
  await page.getByLabel('Show animated weather chart').click()
  await expect(slider(page)).toBeVisible()
}

test.describe('animated viewer', () => {
  test('opens on the first chart with controls, and closes back to the list @mobile', async ({
    page,
  }) => {
    await openViewer(page)

    await expect(slider(page)).toHaveAttribute('aria-valuetext', 'Chart 1 of 4')
    await expect(
      page.getByRole('img', { name: /satellite chart for/i }),
    ).toHaveCount(1)

    await page.getByLabel('Show static weather chart list').click()

    // Back to the list: the viewer's controls go, the time axis stays.
    await expect(page.getByLabel('Play animation')).toBeHidden()
    await expect(slider(page)).toBeAttached()
    await expect(
      page.getByRole('img', { name: /satellite chart for/i }),
    ).toHaveCount(4)
  })

  test('plays through the charts, then pauses where it is @mobile', async ({
    page,
  }) => {
    await openViewer(page)

    await page.getByLabel('Play animation').click()
    await expect(page.getByLabel('Pause animation')).toBeVisible()
    await expect(slider(page)).not.toHaveAttribute(
      'aria-valuetext',
      'Chart 1 of 4',
      {
        timeout: 4000,
      },
    )

    await page.getByLabel('Pause animation').click()
    await expect(page.getByLabel('Play animation')).toBeVisible()
    const paused = await slider(page).getAttribute('aria-valuetext')
    await page.waitForTimeout(2200)
    await expect(slider(page)).toHaveAttribute('aria-valuetext', paused!)
  })

  test('scrubs to a chart, and steps forward and back @mobile', async ({
    page,
  }) => {
    await openViewer(page)

    await slider(page).fill('2')
    await expect(slider(page)).toHaveAttribute('aria-valuetext', 'Chart 3 of 4')

    await page.getByLabel('Step forward').click()
    await expect(slider(page)).toHaveAttribute('aria-valuetext', 'Chart 4 of 4')

    // Stepping stops at the last chart rather than wrapping round.
    await page.getByLabel('Step forward').click()
    await expect(slider(page)).toHaveAttribute('aria-valuetext', 'Chart 4 of 4')

    await page.getByLabel('Step backward').click()
    await expect(slider(page)).toHaveAttribute('aria-valuetext', 'Chart 3 of 4')

    await slider(page).fill('0')
    await page.getByLabel('Step backward').click()
    await expect(slider(page)).toHaveAttribute('aria-valuetext', 'Chart 1 of 4')
  })
})

// While playing, the handle runs along the axis instead of hopping once per
// chart. Sampled from the page itself, in real time, over most of one interval.
const handleXs = (page: Page, durationMs: number) =>
  page.evaluate(async (duration) => {
    const handle = document.querySelector('[data-handle]')!
    const xs: number[] = []
    const start = performance.now()
    while (performance.now() - start < duration) {
      xs.push(Math.round(handle.getBoundingClientRect().x * 10) / 10)
      await new Promise((resolve) => setTimeout(resolve, 40))
    }
    return xs
  }, durationMs)

test.describe('the handle while playing', () => {
  test('glides smoothly instead of hopping @mobile', async ({ page }) => {
    await openViewer(page)

    await page.getByLabel('Play animation').click()
    await expect(page.getByLabel('Pause animation')).toBeVisible()
    const xs = await handleXs(page, 800)

    // Many positions within one second, rising steadily.
    expect(new Set(xs).size).toBeGreaterThan(8)
    const rising = xs.filter((x, i) => i > 0 && x >= xs[i - 1] - 0.5).length
    expect(rising).toBeGreaterThan(xs.length - 4)
  })

  // Pausing mid-glide eases the handle back onto the chart that is on screen, so
  // the handle never points between two charts while the picture shows one.
  test('settles on the chart that is showing when paused @mobile', async ({
    page,
  }) => {
    await openViewer(page)
    await page.getByLabel('Play animation').click()
    await page.waitForTimeout(1300)

    await page.getByLabel('Pause animation').click()
    await page.waitForTimeout(450)
    const xs = await handleXs(page, 500)

    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(1)
    const index = Number(await slider(page).inputValue())
    const at = Number(
      await page.locator('[data-handle]').getAttribute('data-at'),
    )
    expect(at).toBeCloseTo(index / 3, 3)
  })

  test.describe('for a visitor who prefers less motion', () => {
    test.use({ reducedMotion: 'reduce' })

    test('hops from chart to chart, as before', async ({ page }) => {
      await openViewer(page)

      await page.getByLabel('Play animation').click()
      const xs = await handleXs(page, 800)

      // At most the starting chart and the next one.
      expect(new Set(xs).size).toBeLessThanOrEqual(3)
    })
  })
})
