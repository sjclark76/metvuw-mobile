import AxeBuilder from '@axe-core/playwright'
import { expect, Page, test } from '@playwright/test'
import sharp from 'sharp'

const pages = [
  ['home', '/'],
  ['satellite', '/satellite'],
  ['radar', '/radar/nl'],
  ['upper air', '/upperair'],
  ['offline', '/offline'],
] as const

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function openAndSettle(page: Page, path: string) {
  await page.goto(path)
  await page.waitForSelector('nav')
  // Chart pages render their content after the first paint.
  if (path !== '/offline') await page.waitForSelector('main img')
  // Let the entrance animations finish: scanning mid-fade measures blended colours.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  )
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`axe, ${colorScheme} mode`, () => {
    test.use({ colorScheme })

    for (const [name, path] of pages) {
      test(`${name} page has no accessibility violations`, async ({ page }) => {
        await openAndSettle(page, path)

        const results = await new AxeBuilder({ page })
          .withTags(WCAG_TAGS)
          .analyze()

        expect(results.violations).toEqual([])
      })
    }
  })
}

// axe cannot always evaluate the navbar's text against what is behind it (it
// reports it as "needs review"), so measure each item's own text colour against
// the background that is actually rendered under it.
const luminance = ([r, g, b]: number[]) => {
  const channel = (c: number) =>
    (c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}
const contrast = (a: number[], b: number[]) => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

for (const [label, width] of [
  ['desktop', 1600],
  ['mobile', 390],
] as const) {
  test(`navbar text has 4.5:1 contrast over its background (${label})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await openAndSettle(page, '/satellite')
    if (width < 1000) await page.getByLabel('Menu').click()
    await page.waitForTimeout(400)

    const items = await page.evaluate(() =>
      [...document.querySelectorAll('nav a, nav button')]
        .filter((el) => (el as HTMLElement).offsetWidth > 0)
        .map((el) => {
          const box = el.getBoundingClientRect()
          return {
            name: (
              el.getAttribute('aria-label') ||
              el.textContent ||
              ''
            ).trim(),
            x: Math.round(box.x),
            y: Math.round(box.y),
            width: Math.round(box.width),
            height: Math.round(box.height),
            // The text colour as the browser resolved it, as [r, g, b].
            color: (getComputedStyle(el).color.match(/\d+/g) ?? [])
              .slice(0, 3)
              .map(Number),
          }
        })
        .filter((item) => item.color.length === 3),
    )
    expect(items.length).toBeGreaterThan(5)

    // Hide the text, then read the background underneath it.
    await page.addStyleTag({
      content:
        'nav * { color: transparent !important } nav svg { visibility: hidden !important }',
    })
    await page.mouse.move(0, 890)
    const { data, info } = await sharp(
      await page.screenshot({ clip: { x: 0, y: 0, width, height: 700 } }),
    )
      .raw()
      .toBuffer({ resolveWithObject: true })
    const pixel = (x: number, y: number) => {
      const i = (y * info.width + Math.min(x, info.width - 1)) * info.channels
      return [data[i], data[i + 1], data[i + 2]]
    }

    const failures = items
      .map((item) => {
        const y = item.y + Math.round(item.height / 2)
        const samples = [
          item.x + 4,
          item.x + Math.round(item.width / 2),
          item.x + item.width - 4,
        ].map((x) => pixel(x, y))
        const worst = Math.min(
          ...samples.map((sample) => contrast(item.color, sample)),
        )
        return { name: item.name, ratio: Number(worst.toFixed(2)) }
      })
      .filter((item) => item.ratio < 4.5)

    expect(failures).toEqual([])
  })
}

// Visitors who ask for reduced motion must not see things slide: the footer
// controls enter from the side when the animated viewer opens. They may still
// fade, so the rule is that a control is never visible while displaced.
test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the animated viewer controls never visibly slide in', async ({
    page,
  }) => {
    await openAndSettle(page, '/satellite')
    await page.getByLabel('Show animated weather chart').click()

    const samples = await page.evaluate(async () => {
      const seen: { x: number; opacity: number }[] = []
      const start = performance.now()
      while (performance.now() - start < 1600) {
        const button = document.querySelector('[aria-label="Play animation"]')
        if (button) {
          const { transform, opacity } = getComputedStyle(button)
          const x =
            transform === 'none'
              ? 0
              : Number(transform.match(/matrix\(([^)]+)\)/)![1].split(',')[4])
          seen.push({ x, opacity: Number(opacity) })
        }
        await new Promise((resolve) => setTimeout(resolve, 25))
      }
      return seen
    })

    expect(samples.length).toBeGreaterThan(10)
    expect(samples.filter((s) => s.opacity > 0.05 && s.x !== 0)).toEqual([])
  })
})
