import { expect, Page, test } from '@playwright/test'

// A heads-up when heavy rain is ahead at a pin, from the charts. The stub's charts
// have a block of a known band over Wanaka (see e2e/stub/metvuw-stub.mjs): the
// fourth chart (hour 024) is the top of the scale, 20+ mm, so very heavy rain is
// ahead there. The stub's forecast is from 15 October 2026, so the clock is set to
// before its charts, or every one of them would already be past.
const BEFORE_THE_CHARTS = new Date('2026-10-15T12:00:00Z')

const wanaka = {
  name: 'Wanaka',
  context: 'Otago',
  kind: 'Town',
  latitude: -44.703,
  longitude: 169.132,
}
const auckland = {
  name: 'Auckland',
  context: 'Auckland',
  kind: 'City',
  latitude: -36.848,
  longitude: 174.763,
}

async function pin(page: Page, ...pins: object[]) {
  await page.addInitScript(
    (value) => localStorage.setItem('pins', JSON.stringify(value)),
    pins,
  )
}
const note = (page: Page) =>
  page.getByRole('region', { name: 'Heavy rain ahead' })

test.describe('heavy rain ahead at a pin', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(BEFORE_THE_CHARTS)
  })

  test('says so, and how much, when the charts show it @mobile', async ({
    page,
  }) => {
    await pin(page, wanaka)

    await page.goto('/regions/nz')

    await expect(note(page)).toBeVisible()
    await expect(note(page)).toContainText(
      'Very heavy rain ahead at Wanaka: 20+ mm in the 6 hours from',
    )
  })

  test('outlines the cell of the rain strip where it falls', async ({
    page,
  }) => {
    await pin(page, wanaka)

    await page.goto('/regions/nz')

    await expect(note(page)).toBeVisible()
    await expect(page.locator('[data-rain-cell="3"]')).toHaveAttribute(
      'data-heavy-rain',
      '',
    )
    await expect(page.locator('[data-heavy-rain]')).toHaveCount(1)
  })

  test('goes to that chart when tapped @mobile', async ({ page }) => {
    await pin(page, wanaka)
    await page.goto('/regions/nz')

    await note(page)
      .getByRole('button', { name: /Very heavy rain ahead at Wanaka/ })
      .click()

    await expect(
      page.getByRole('slider', { name: 'Chart position' }),
    ).toHaveAttribute('aria-valuetext', 'Chart 4 of 10')
  })

  test('is at the top of the page, and scrolls away with it', async ({
    page,
  }) => {
    await pin(page, wanaka)
    await page.goto('/regions/nz')
    await expect(note(page)).toBeVisible()
    const before = (await note(page).boundingBox())!.y

    await page.evaluate(() => window.scrollTo(0, 300))

    await expect
      .poll(async () => (await note(page).boundingBox())!.y)
      .toBeLessThan(before - 100)
  })

  test('is not shown when turned off in Settings', async ({ page }) => {
    await pin(page, wanaka)
    await page.addInitScript(() =>
      localStorage.setItem('showHeavyRain', 'false'),
    )
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')
    await expect(page.locator('[data-rain-cell="3"]')).toHaveAttribute(
      'data-reading',
      'rain',
    )

    await expect(note(page)).toBeHidden()
    await expect(page.locator('[data-heavy-rain]')).toHaveCount(0)
    await expect(page.locator('[data-heavy-rain-slot]')).toBeHidden()
  })

  test('has no place on the page for a visitor with no pins', async ({
    page,
  }) => {
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')

    await expect(page.locator('[data-heavy-rain-slot]')).toBeHidden()
  })

  test('holds its place from the start, and says it is checking', async ({
    page,
  }) => {
    await pin(page, wanaka)
    // Charts that never arrive keep the check going.
    await page.route(/\.(webp|png|gif)(\?.*)?$/, (route) => route.abort())
    await page.goto('/regions/nz', { waitUntil: 'domcontentloaded' })

    const slot = page.locator('[data-heavy-rain-slot]')
    await expect(slot).toBeVisible()
    expect((await slot.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    await expect(slot).toContainText('Checking rain at your pins')
  })

  test('says no heavy rain for a pin where it stays dry', async ({ page }) => {
    await pin(page, auckland)
    await page.goto('/regions/nz')
    await expect(page.locator('[data-rain-cell="9"]')).not.toHaveAttribute(
      'data-reading',
      'unknown',
    )

    await expect(note(page)).toBeHidden()
    await expect(page.locator('[data-heavy-rain-slot]')).toContainText(
      'No heavy rain ahead at your pins',
    )
  })

  test('says nothing once the heavy rain is past', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-30T00:00:00Z'))
    await pin(page, wanaka)
    await page.goto('/regions/nz')
    await expect(page.locator('[data-rain-cell="3"]')).toHaveAttribute(
      'data-reading',
      'rain',
    )

    await expect(note(page)).toBeHidden()
  })

  test('shows even with the time slider hidden in Settings', async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem('showSlider', 'false'))
    await pin(page, wanaka)

    await page.goto('/regions/nz')

    await expect(note(page)).toBeVisible()
  })

  test('does not move the page when it arrives', async ({ page }) => {
    await page.addInitScript(() => {
      const samples: number[] = []
      ;(window as unknown as { samples: number[] }).samples = samples
      let fontFrames = 0
      const sample = () => {
        const list = document
          .querySelector('[data-chart-index="0"]')
          ?.closest('ul')
        // Not while the web fonts are still arriving: the title may be a line taller
        // in the fallback font, which is a different move.
        // A frame after they are in, when the page has been laid out with them.
        fontFrames = document.fonts.status === 'loaded' ? fontFrames + 1 : 0
        const settled = fontFrames > 1
        const top =
          list && settled
            ? Math.round(list.getBoundingClientRect().top + scrollY)
            : 0
        if (top > 0) samples.push(top)
        requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
    })
    await pin(page, wanaka)

    await page.goto('/regions/nz')
    await expect(note(page)).toBeVisible()
    await page.waitForTimeout(400)

    const samples = await page.evaluate(
      () => (window as unknown as { samples: number[] }).samples,
    )
    expect(new Set(samples).size).toBe(1)
  })
})
