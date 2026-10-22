import AxeBuilder from '@axe-core/playwright'
import { expect, Page, test } from '@playwright/test'

import { openGroup, openMenu } from './menu-helpers'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const viewer = (page: Page) => page.getByLabel('Show animated weather chart')
const slider = (page: Page) =>
  page.getByRole('slider', { name: 'Chart position' })
const footer = (page: Page) => page.locator('footer')

async function setting(page: Page, name: string, on: boolean) {
  await page.goto('/settings')
  const toggle = page.getByRole('switch', { name })
  await expect(toggle).toBeVisible()
  if ((await toggle.getAttribute('aria-checked')) !== String(on)) {
    await toggle.click()
  }
  await expect(toggle).toHaveAttribute('aria-checked', String(on))
}

test.describe('the Settings page', () => {
  test('is in the menu @mobile', async ({ page }) => {
    await page.goto('/offline')
    await openMenu(page)

    await page.getByRole('link', { name: 'Settings' }).click()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings')
    await expect(page).toHaveURL(/\/settings$/)
  })

  test('has no accessibility violations', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByRole('switch').first()).toBeVisible()

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()

    expect(results.violations).toEqual([])
  })
})

test.describe('the footer', () => {
  test('is complete until something is turned off @mobile', async ({
    page,
  }) => {
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')

    await expect(viewer(page)).toBeVisible()
    await expect(slider(page)).toBeAttached()
    await expect(footer(page)).toBeVisible()
  })

  test('has no animated viewer when it is turned off, and keeps the slider @mobile', async ({
    page,
  }) => {
    await setting(page, 'Show the animated viewer', false)

    await page.goto('/regions/nz')
    await page.waitForSelector('main img')

    await expect(viewer(page)).toBeHidden()
    await expect(page.locator('footer [data-footer-slider]')).toBeVisible()
    await expect(footer(page)).toBeVisible()
  })

  test('has no slider or rain strip when it is turned off, and keeps the viewer @mobile', async ({
    page,
  }) => {
    await page.addInitScript(() =>
      localStorage.setItem(
        'pins',
        JSON.stringify([
          {
            name: 'Wanaka',
            context: 'Otago',
            kind: 'Town',
            latitude: -44.703,
            longitude: 169.132,
          },
        ]),
      ),
    )
    await setting(page, 'Show the time slider', false)

    await page.goto('/regions/nz')
    await page.waitForSelector('main img')

    await expect(slider(page)).toBeHidden()
    await expect(page.locator('[data-rain-strip]')).toBeHidden()
    await expect(viewer(page)).toBeVisible()
  })

  test('is not there at all when both are turned off, and the keys drop to the bottom @mobile', async ({
    page,
  }) => {
    await setting(page, 'Show the animated viewer', false)
    await setting(page, 'Show the time slider', false)

    await page.goto('/regions/nz')
    await page.waitForSelector('main img')

    await expect(footer(page)).toBeHidden()
    const key = page.getByRole('button', { name: 'Show rainfall legend' })
    await expect(key).toBeVisible()
    const box = (await key.boundingBox())!
    const viewport = page.viewportSize()!
    // Where the footer was, the key now sits a quarter of a rem above the edge.
    expect(viewport.height - (box.y + box.height)).toBeLessThan(24)
  })

  test('is hidden from the first paint, so it never flashes @mobile', async ({
    page,
  }) => {
    await setting(page, 'Show the animated viewer', false)
    await setting(page, 'Show the time slider', false)

    await page.goto('/regions/nz', { waitUntil: 'commit' })
    await page.waitForSelector('html[data-hide-viewer][data-hide-slider]', {
      state: 'attached',
    })

    await expect(page.locator('html')).toHaveAttribute('data-hide-viewer', '')
    await expect(page.locator('html')).toHaveAttribute('data-hide-slider', '')
  })

  test('comes back when both are turned on again', async ({ page }) => {
    await setting(page, 'Show the animated viewer', false)
    await setting(page, 'Show the animated viewer', true)

    await page.goto('/regions/nz')
    await page.waitForSelector('main img')

    await expect(viewer(page)).toBeVisible()
  })
})

// The settings take effect at once: nothing here loads a page afresh after turning a
// switch (the app is moved between by its own links), which is how it is used.
test.describe('changing a setting while the app is open', () => {
  async function toggleHere(page: Page, name: string) {
    const toggle = page.getByRole('switch', { name })
    const before = await toggle.getAttribute('aria-checked')
    await toggle.click()
    await expect(toggle).not.toHaveAttribute('aria-checked', before!)
  }
  async function goByMenu(page: Page, region: string) {
    await openMenu(page)
    await openGroup(page, 'New Zealand')
    await page.getByRole('link', { name: region, exact: true }).click()
  }

  test('hides the viewer at once, and brings it back at once @mobile', async ({
    page,
  }) => {
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')
    await expect(viewer(page)).toBeVisible()
    await openMenu(page)
    await page.getByRole('link', { name: 'Settings' }).click()

    await toggleHere(page, 'Show the animated viewer')
    await goByMenu(page, 'South Island')
    await page.waitForSelector('main img')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'South Island',
    )
    await expect(viewer(page)).toBeHidden()

    await openMenu(page)
    await page.getByRole('link', { name: 'Settings' }).click()
    await toggleHere(page, 'Show the animated viewer')
    await goByMenu(page, 'North Island')
    await page.waitForSelector('main img')

    await expect(viewer(page)).toBeVisible()
  })

  test('hides the slider at once, and the whole footer when the viewer goes too @mobile', async ({
    page,
  }) => {
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')
    await expect(slider(page)).toBeAttached()
    await openMenu(page)
    await page.getByRole('link', { name: 'Settings' }).click()

    await toggleHere(page, 'Show the time slider')
    await toggleHere(page, 'Show the animated viewer')
    await goByMenu(page, 'South Island')
    await page.waitForSelector('main img')

    await expect(footer(page)).toBeHidden()
  })

  test('takes effect on the page you come back to with the back button', async ({
    page,
  }) => {
    await page.goto('/regions/nz')
    await page.waitForSelector('main img')
    await openMenu(page)
    await page.getByRole('link', { name: 'Settings' }).click()
    await toggleHere(page, 'Show the animated viewer')

    await page.goBack()
    await page.waitForSelector('main img')

    await expect(viewer(page)).toBeHidden()
  })
})

test.describe('the home page', () => {
  test('is the one chosen: the app opens on it @mobile', async ({ page }) => {
    await page.goto('/settings')

    await page
      .getByLabel('Home page', { exact: true })
      .selectOption('/radar/nl')
    await page.goto('/')

    await expect(page).toHaveURL(/\/radar\/nl$/)
    await expect(
      page.getByRole('button', { name: 'Use this page as my home page' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  test('shows what the button in the navigation set', async ({ page }) => {
    await page.goto('/radar/nl')
    await page
      .getByRole('button', { name: 'Use this page as my home page' })
      .click()

    await page.goto('/settings')

    await expect(page.getByLabel('Home page', { exact: true })).toHaveValue(
      '/radar/nl',
    )
  })
})

test.describe('the theme', () => {
  test('is changed here as in the navigation', async ({ page }) => {
    await page.goto('/settings')

    await page.getByRole('button', { name: 'Dark', exact: true }).click()

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(
      page.getByRole('button', { name: /^Theme:/ }),
    ).toHaveAccessibleName('Theme: Dark')
  })
})

test.describe('the data on this device', () => {
  test('clears the pins, after asking', async ({ page }) => {
    await page.addInitScript(() => {
      if (!localStorage.getItem('pins')) {
        localStorage.setItem(
          'pins',
          JSON.stringify([
            {
              name: 'Wanaka',
              context: 'Otago',
              kind: 'Town',
              latitude: -44.703,
              longitude: 169.132,
            },
          ]),
        )
      }
    })
    await page.goto('/settings')
    await expect(page.getByText('1 pin on this device.')).toBeVisible()

    await page.getByRole('button', { name: 'Clear all pins' }).click()
    await expect(page.getByRole('alertdialog')).toContainText('Clear 1 pin?')
    await page.getByRole('button', { name: 'Yes, clear' }).click()

    await expect(page.getByText('No pins.')).toBeVisible()
    await page.goto('/pins')
    await expect(page.getByText(/No pins yet/)).toBeVisible()
  })

  test('keeps the pins when asked not to clear them', async ({ page }) => {
    await page.addInitScript(() =>
      localStorage.setItem(
        'pins',
        JSON.stringify([
          {
            name: 'Wanaka',
            context: 'Otago',
            kind: 'Town',
            latitude: -44.703,
            longitude: 169.132,
          },
        ]),
      ),
    )
    await page.goto('/settings')

    await page.getByRole('button', { name: 'Clear all pins' }).click()
    await page.getByRole('button', { name: 'Cancel' }).click()

    await expect(page.getByText('1 pin on this device.')).toBeVisible()
  })
})

test.describe('with no connection', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'needs Chromium network emulation',
  )
  test.use({ serviceWorkers: 'allow' })

  test('opens once a page has been saved, though it was never visited', async ({
    page,
    context,
  }) => {
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
    await page.goto('/settings')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings')
    await expect(page.getByRole('switch').first()).toBeVisible()
  })
})
