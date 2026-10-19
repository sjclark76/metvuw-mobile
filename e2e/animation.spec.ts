import { expect, Page, test } from '@playwright/test'

// Four satellite charts, one second apart when playing.
const slider = (page: Page) => page.getByLabel('Chart position')

async function openViewer(page: Page) {
  await page.goto('/satellite')
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

    await expect(slider(page)).toBeHidden()
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
