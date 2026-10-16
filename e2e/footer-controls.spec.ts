import { expect, Page, test } from '@playwright/test'

async function openSatellite(page: Page) {
  await page.goto('/satellite')
  await page.waitForSelector('main img')
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((a) => a.finished)),
  )
}

const centreX = async (page: Page, label: string) => {
  const box = await page.getByLabel(label).boundingBox()
  return box!.x + box!.width / 2
}

// The play button used to be moved by motion's `layout` prop; CSS does it now.
test.describe('footer controls', () => {
  test('the play button starts centred in the footer', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await openSatellite(page)

    expect(
      Math.abs((await centreX(page, 'Show animated weather chart')) - 640),
    ).toBeLessThan(2)
  })

  test('opening the viewer slides it left and shows the controls beside it', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await openSatellite(page)
    const before = await centreX(page, 'Show animated weather chart')

    await page.getByLabel('Show animated weather chart').click()
    const close = page.getByLabel('Show static weather chart list')
    await expect(page.getByLabel('Play animation')).toBeVisible()
    await page.evaluate(() =>
      Promise.all(document.getAnimations().map((a) => a.finished)),
    )

    const closeBox = (await close.boundingBox())!
    const playBox = (await page.getByLabel('Play animation').boundingBox())!
    expect(closeBox.x + closeBox.width / 2).toBeLessThan(before - 200)
    expect(playBox.x).toBeGreaterThan(closeBox.x + closeBox.width)
  })

  test('closing the viewer brings it back to the centre', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await openSatellite(page)
    await page.getByLabel('Show animated weather chart').click()
    await expect(page.getByLabel('Play animation')).toBeVisible()

    await page.getByLabel('Show static weather chart list').click()
    await expect(page.getByLabel('Play animation')).toBeHidden()
    await page.evaluate(() =>
      Promise.all(document.getAnimations().map((a) => a.finished)),
    )

    expect(
      Math.abs((await centreX(page, 'Show animated weather chart')) - 640),
    ).toBeLessThan(2)
  })

  test('slides rather than jumps', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await openSatellite(page)
    await page.getByLabel('Show animated weather chart').click()

    const samples = await page.evaluate(async () => {
      const xs: number[] = []
      const start = performance.now()
      while (performance.now() - start < 700) {
        const button = document.querySelector(
          '[aria-label="Show static weather chart list"]',
        )
        if (button) xs.push(Math.round(button.getBoundingClientRect().x))
        await new Promise((resolve) => setTimeout(resolve, 30))
      }
      return xs
    })

    expect(new Set(samples).size).toBeGreaterThan(5)
  })
})
