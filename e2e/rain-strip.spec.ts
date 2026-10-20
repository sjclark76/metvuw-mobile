import { expect, Page, test } from '@playwright/test'

// The rain strip: for a pinned place, a cell for each chart, coloured by the band of
// rain the chart shows there. The stub serves rain charts with a block of a known
// band over Wanaka (see e2e/stub/metvuw-stub.mjs): hour 006 none, 012 band 1
// (magenta), 018 band 5 (blue), 024 band 20+ (red-orange), the rest none. The
// charts are listed in that order, so cells 0 to 3 are those four.
const PALE = 'rgb(230, 230, 255)'
const MAGENTA = 'rgb(255, 0, 255)'
const BLUE = 'rgb(0, 0, 255)'
const RED_ORANGE = 'rgb(255, 63, 0)'

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
const cell = (page: Page, index: number) =>
  page.locator(`[data-rain-cell="${index}"]`)
const reading = (page: Page) => page.locator('[data-rain-reading]').first()
const slider = (page: Page) =>
  page.getByRole('slider', { name: 'Chart position' })

test.describe('the rain strip', () => {
  test('colours each chart by the rain over the pin @mobile', async ({
    page,
  }) => {
    await pin(page, wanaka)

    await page.goto('/regions/nz')

    await expect(page.locator('[data-rain-cell]')).toHaveCount(10)
    await expect(cell(page, 0)).toHaveCSS('background-color', PALE)
    await expect(cell(page, 1)).toHaveCSS('background-color', MAGENTA)
    await expect(cell(page, 2)).toHaveCSS('background-color', BLUE)
    await expect(cell(page, 3)).toHaveCSS('background-color', RED_ORANGE)
    await expect(cell(page, 4)).toHaveCSS('background-color', PALE)
  })

  test('says what the chart in view shows, and goes to the chart tapped @mobile', async ({
    page,
  }) => {
    await pin(page, wanaka)
    await page.goto('/regions/nz')
    await expect(cell(page, 3)).toHaveCSS('background-color', RED_ORANGE)
    await expect(reading(page)).toContainText('under 1 mm')

    await cell(page, 2).click()

    await expect(slider(page)).toHaveAttribute(
      'aria-valuetext',
      'Chart 3 of 10',
    )
    await expect(reading(page)).toContainText('5–6 mm in 6 hr')

    await cell(page, 3).click()

    await expect(reading(page)).toContainText('20+ mm in 6 hr')
  })

  test('is not there without a pin', async ({ page }) => {
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')

    await expect(page.locator('[data-rain-strip]')).toHaveCount(0)
  })

  test('says so when the chart does not show the pin, and draws no cells', async ({
    page,
  }) => {
    await pin(page, wanaka)

    await page.goto('/regions/europe')

    await expect(reading(page)).toContainText('not on this chart')
    await expect(page.locator('[data-rain-cell]')).toHaveCount(0)
  })

  test('chooses between pins, or shows all of them, and remembers the choice', async ({
    page,
  }) => {
    await pin(page, wanaka, auckland)
    await page.goto('/regions/nz')
    const select = page.getByLabel('Pin for the rain strip')
    await expect(select.locator('option')).toHaveText([
      'Wanaka',
      'Auckland',
      'All pins',
    ])
    await expect(page.locator('[data-rain-row]')).toHaveCount(1)

    await select.selectOption({ label: 'All pins' })

    await expect(page.locator('[data-rain-row]')).toHaveCount(2)
    const auckland_row = page.locator('[data-rain-row]').nth(1)
    await expect(auckland_row.locator('[data-rain-cell]').nth(3)).toHaveCSS(
      'background-color',
      PALE,
    )
    await expect(
      page
        .locator('[data-rain-row]')
        .first()
        .locator('[data-rain-cell]')
        .nth(3),
    ).toHaveCSS('background-color', RED_ORANGE)

    await page.reload()

    await expect(page.locator('[data-rain-row]')).toHaveCount(2)
    await expect(page.getByLabel('Pin for the rain strip')).toHaveValue('all')
  })

  // The footer is fixed, not sticky, so it does not flash when the page jumps to a
  // chart on an iPhone; and it must not change size or place as the slider moves.
  test('keeps the footer where it is as the slider goes across the charts @mobile', async ({
    page,
  }) => {
    await pin(page, wanaka)
    await page.goto('/regions/nz')
    await expect(cell(page, 3)).toHaveCSS('background-color', RED_ORANGE)
    const footer = page.locator('footer')
    await expect(footer).toHaveCSS('position', 'fixed')

    const seen = new Set<string>()
    await slider(page).focus()
    for (let step = 0; step < 9; step++) {
      await page.keyboard.press('ArrowRight')
      await expect(slider(page)).toHaveAttribute(
        'aria-valuetext',
        `Chart ${step + 2} of 10`,
      )
      const box = (await footer.boundingBox())!
      seen.add(`${box.y + box.height}:${box.height}`)
    }

    expect(seen.size).toBe(1)
    const viewport = page.viewportSize()!
    expect([...seen][0].startsWith(`${viewport.height}:`)).toBe(true)
  })

  test('leaves the end of the page clear of the footer @mobile', async ({
    page,
  }) => {
    await pin(page, wanaka)
    await page.goto('/regions/nz')
    await expect(cell(page, 3)).toHaveCSS('background-color', RED_ORANGE)

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    const lastChart = page.locator('[data-chart-index="9"]')
    await expect(lastChart).toBeVisible()
    const chart = (await lastChart.boundingBox())!
    const footer = (await page.locator('footer').boundingBox())!
    expect(chart.y + chart.height).toBeLessThanOrEqual(footer.y)
  })
})

test.describe('with no connection', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'needs Chromium network emulation',
  )
  test.use({ serviceWorkers: 'allow' })

  test('reads a saved page’s charts from the cache', async ({
    page,
    context,
  }) => {
    await pin(page, wanaka)
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) =>
          navigator.serviceWorker.addEventListener('controllerchange', resolve),
        )
      }
    })
    await page.reload()
    await page.waitForSelector('main img')
    await page.getByRole('button', { name: 'Save for offline' }).click()
    await expect(page.getByText(/^Saved · /)).toBeVisible({ timeout: 30_000 })

    await context.setOffline(true)
    await page.goto('/regions/nz')

    await expect(cell(page, 3)).toHaveCSS('background-color', RED_ORANGE)
    await expect(cell(page, 2)).toHaveCSS('background-color', BLUE)
  })
})
