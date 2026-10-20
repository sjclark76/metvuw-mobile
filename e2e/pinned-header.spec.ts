import { expect, Page, test } from '@playwright/test'

// The bar across the top is fixed to the screen, not sticky: on an iPhone a sticky
// bar flashed when the time slider jumped the page, most going back up. A fixed bar
// takes no room, so a gap holds the page below it; these check that the page looks
// and behaves as it did.
const pages = [
  ['rain', '/regions/nz'],
  ['satellite', '/satellite'],
  ['radar', '/radar/nl'],
  ['upper air', '/upperair/93112'],
  ['offline', '/offline'],
] as const

const top = (page: Page, selector: string) =>
  page.evaluate(
    (s) => document.querySelector(s)!.getBoundingClientRect().top,
    selector,
  )
const bottom = (page: Page, selector: string) =>
  page.evaluate(
    (s) => document.querySelector(s)!.getBoundingClientRect().bottom,
    selector,
  )

test.describe('the header bar', () => {
  for (const [name, path] of pages) {
    test(`stays at the top of the screen while the ${name} page scrolls @mobile`, async ({
      page,
    }) => {
      await page.goto(path)
      await page.waitForSelector('header')

      await page.evaluate(() => scrollTo(0, 1500))
      await page.waitForTimeout(100)

      expect(await top(page, 'header')).toBe(0)
      expect(
        await page.evaluate(
          () => getComputedStyle(document.querySelector('header')!).position,
        ),
      ).toBe('fixed')
    })
  }

  for (const [device, width, height] of [
    ['a phone', 390, 800],
    ['a desktop', 1280, 800],
  ] as const) {
    test(`leaves the page starting exactly below it, on ${device} @mobile`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height })
      await page.goto('/regions/nz')
      await page.waitForSelector('main h1')

      // No gap and no overlap: the page begins where the bar ends.
      expect(await top(page, 'main')).toBe(await bottom(page, 'header'))
    })
  }

  test('keeps the page below it at a larger text size @mobile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto('/regions/nz')
    await page.addStyleTag({ content: 'html{font-size:150% !important}' })
    await page.waitForTimeout(200)

    expect(await top(page, 'main')).toBe(await bottom(page, 'header'))
  })

  test('is pushed down by nothing: the menu opening moves the page down, as before @mobile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto('/regions/nz')
    await page.waitForSelector('main h1')
    const closed = await bottom(page, 'header')

    await page.getByRole('button', { name: 'Menu' }).click()
    await page.waitForTimeout(200)

    const open = await bottom(page, 'header')
    expect(open).toBeGreaterThan(closed + 100)
    // The page is still below the (taller) bar, not hidden under it.
    expect(await top(page, 'main')).toBe(open)
  })

  test('does not move the page while it loads @mobile', async ({ page }) => {
    await page.addInitScript(() => {
      const samples: number[] = []
      ;(window as unknown as { samples: number[] }).samples = samples
      const sample = () => {
        const main = document.querySelector('main')
        if (main) samples.push(Math.round(main.getBoundingClientRect().top))
        requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
    })

    await page.goto('/regions/nz')
    await page.waitForSelector('main img')
    await page.waitForTimeout(500)

    const samples = await page.evaluate(
      () => (window as unknown as { samples: number[] }).samples,
    )
    expect(samples.length).toBeGreaterThan(5)
    expect(new Set(samples).size).toBe(1)
  })
})
