import { expect, test } from '@playwright/test'

// Items below the first screen are skipped until they are near, and hold a
// placeholder height meanwhile. Where it is wrong, the page jumps as items above
// the screen are drawn, which shows going back up (WebKit does not hold the
// position). So the placeholder must be the height the item really has.
const pages = [
  ['rain', '/regions/nz'],
  ['satellite', '/satellite'],
  ['radar', '/radar/nl'],
  ['upper air', '/upperair/93112'],
] as const

for (const [name, path] of pages) {
  for (const [device, width, height] of [
    ['a phone', 390, 800],
    ['a desktop', 1280, 800],
  ] as const) {
    test(`${name} charts hold their real height while skipped, on ${device} @mobile`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height })
      await page.goto(path)
      await page.waitForSelector('main img')
      await page.evaluate(() =>
        Promise.all(
          document
            .getAnimations()
            .map((a) => a.finished.catch(() => undefined)),
        ),
      )

      const items = '[data-chart-index]'
      const count = await page.locator(items).count()
      // Items from the fourth on are the ones skipped.
      expect(count).toBeGreaterThan(3)

      const heights = () =>
        page.evaluate(
          (selector) =>
            [...document.querySelectorAll<HTMLElement>(selector)].map(
              (element) => element.getBoundingClientRect().height,
            ),
          items,
        )

      // As placeholders: nothing below the first screen has been drawn yet.
      const skipped = await heights()
      // Then drawn, one by one, as the visitor reaches them.
      for (let index = 3; index < count; index++) {
        await page
          .locator(`[data-chart-index="${index}"]`)
          .scrollIntoViewIfNeeded()
        await page.waitForTimeout(150)
      }
      await page.evaluate(() => scrollTo(0, 0))
      const drawn = await heights()

      for (let index = 3; index < count; index++) {
        expect(
          Math.abs(skipped[index] - drawn[index]),
          `chart ${index}: placeholder ${skipped[index]}px, real ${drawn[index]}px`,
        ).toBeLessThanOrEqual(1)
      }
    })
  }
}
