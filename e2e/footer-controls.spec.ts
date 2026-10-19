import { expect, Page, test } from '@playwright/test'

// The footer is a forecast timeline: one tick for each chart, day names at local
// midnight, and a handle on the chart you are looking at. It works in the list
// and in the animated viewer.
const slider = (page: Page) => page.getByLabel('Chart position')
const value = async (page: Page) => Number(await slider(page).inputValue())

async function openList(page: Page, path = '/regions/nz') {
  await page.goto(path)
  await page.waitForSelector('main img')
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((a) => a.finished)),
  )
}

// Infinity while the chart is not on the page (the list takes a moment to come
// back after the viewer closes), so polling keeps waiting instead of throwing.
const chartTop = (page: Page, index: number) =>
  page.evaluate(
    (i) =>
      document
        .querySelector(`[data-chart-index="${i}"]`)
        ?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY,
    index,
  )

// The axis names days in the visitor's zone, and a minor tick is dropped where a
// day line falls on a chart, so what is drawn depends on the zone. Fixed here to
// the one the site is written for, so the results do not depend on the machine.
test.use({ timezoneId: 'Pacific/Auckland' })

test.describe('time axis in the list', () => {
  test('has a tick for each chart and starts on the first', async ({
    page,
  }) => {
    await openList(page)

    await expect(page.locator('[data-tick]')).toHaveCount(10)
    expect(await value(page)).toBe(0)
    await expect(slider(page)).toHaveAttribute('max', '9')
  })

  test('names the days the charts run over', async ({ page }) => {
    await openList(page)

    // Ten six-hourly charts cover two or three local midnights.
    const days = page.locator('[data-axis-drawing] em')
    expect(await days.count()).toBeGreaterThanOrEqual(1)
    await expect(days.first()).toHaveText(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/)
  })

  test('dragging it scrolls the list to that chart', async ({ page }) => {
    await openList(page)

    await slider(page).fill('6')

    // The chart ends up at the top of the page, under the navigation bar.
    await expect
      .poll(async () => Math.round(await chartTop(page, 6)), { timeout: 5000 })
      .toBeLessThan(140)
    expect(await chartTop(page, 6)).toBeGreaterThan(-20)
    expect(await value(page)).toBe(6)
  })

  test('follows the chart you scroll to', async ({ page }) => {
    await openList(page)

    await page.evaluate(() =>
      document
        .querySelector('[data-chart-index="7"]')!
        .scrollIntoView({ block: 'center' }),
    )

    await expect.poll(() => value(page), { timeout: 5000 }).toBe(7)
  })

  test('keeps your place when you open the viewer and come back', async ({
    page,
  }) => {
    await openList(page)
    await slider(page).fill('4')
    await expect
      .poll(async () => Math.round(await chartTop(page, 4)))
      .toBeLessThan(140)

    await page.getByLabel('Show animated weather chart').click()
    await expect(page.getByLabel('Play animation')).toBeVisible()
    expect(await value(page)).toBe(4)

    await page.getByLabel('Show static weather chart list').click()

    await expect(page.getByLabel('Play animation')).toBeHidden()
    await expect
      .poll(async () => Math.round(await chartTop(page, 4)), { timeout: 5000 })
      .toBeLessThan(200)
    expect(await value(page)).toBe(4)
  })
})

test.describe('time axis in the viewer', () => {
  test.use({ viewport: { width: 390, height: 800 } })

  test('sits on its own row above the controls', async ({ page }) => {
    await openList(page)
    await page.getByLabel('Show animated weather chart').click()
    await expect(page.getByLabel('Play animation')).toBeVisible()

    const axis = (await slider(page).boundingBox())!
    const play = (await page.getByLabel('Play animation').boundingBox())!

    expect(axis.y + axis.height).toBeLessThanOrEqual(play.y + 4)
    // Full width of the footer, not squeezed beside four controls.
    expect(axis.width).toBeGreaterThan(300)
  })

  test('lays the four controls out in one row', async ({ page }) => {
    await openList(page)
    await page.getByLabel('Show animated weather chart').click()

    // Centres, not tops: the view switch is a little larger than the others.
    const centres = await Promise.all(
      [
        'Show static weather chart list',
        'Play animation',
        'Step backward',
        'Step forward',
      ].map(async (label) => {
        const box = (await page.getByLabel(label).boundingBox())!
        return Math.round(box.y + box.height / 2)
      }),
    )

    expect(new Set(centres).size).toBe(1)
  })
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 800 } })

  test('the axis fits beside the view switch, with no horizontal scroll', async ({
    page,
  }) => {
    await openList(page)

    const axis = (await slider(page).boundingBox())!
    expect(axis.x + axis.width).toBeLessThanOrEqual(390)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
  })
})

// The stub's charts are six-hourly from 00Z. In UTC local midnight lands exactly
// on charts, where the day line stands in for the minor tick.
test.describe('in UTC, where midnight falls on the charts', () => {
  test.use({ timezoneId: 'UTC' })

  test('draws a day line, not a second tick, where a day begins', async ({
    page,
  }) => {
    await openList(page)

    // Ten charts, two of them at midnight.
    await expect(page.locator('[data-tick]')).toHaveCount(8)
    await expect(slider(page)).toHaveAttribute('max', '9')
    expect(
      await page.locator('[data-axis-drawing] em').count(),
    ).toBeGreaterThan(0)
  })
})

// iOS only starts dragging a slider that is pressed on its thumb, so the
// invisible slider's thumb must be a real, grabbable size and line up with the
// drawn handle (its centre runs from one inset, 0.75rem, to the other).
test.describe('the slider can be grabbed by touch', () => {
  test('has a thumb big enough to grab', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'reads the WebKit-style thumb')
    await openList(page)

    const thumb = await page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>(
        'input[aria-label="Chart position"]',
      )!
      const style = getComputedStyle(input, '::-webkit-slider-thumb')
      return {
        width: parseFloat(style.width),
        height: parseFloat(style.height),
        rem: parseFloat(getComputedStyle(document.documentElement).fontSize),
      }
    })

    expect(thumb.width).toBeGreaterThanOrEqual(thumb.rem * 1.5)
    expect(thumb.height).toBeGreaterThanOrEqual(40)
  })
})

// The label naming the chart in view sits above the handle. The touch handle is
// the taller one, and it once overlapped the label.
test.describe('the handle and its label @mobile', () => {
  test('are clear of each other', async ({ page }) => {
    await openList(page)

    const gap = await page.evaluate(() => {
      const label = document
        .querySelector('[data-handle-label]')!
        .getBoundingClientRect()
      const handle = document
        .querySelector('[data-handle]')!
        .getBoundingClientRect()
      return handle.top - label.bottom
    })

    expect(gap).toBeGreaterThanOrEqual(3)
  })
})

// A long forecast puts many days across a phone; their names must not run into
// each other. Days that do not fit keep their line but lose their name.
test.describe('day names on the axis @mobile', () => {
  test('never overlap', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await openList(page)

    const boxes = await page.evaluate(() =>
      [...document.querySelectorAll('[data-axis-drawing] em')]
        .map((el) => el.getBoundingClientRect())
        .map((box) => ({ left: box.left, right: box.right }))
        .sort((a, b) => a.left - b.left),
    )

    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i].left).toBeGreaterThanOrEqual(boxes[i - 1].right + 2)
    }
  })
})
