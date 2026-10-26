import { expect, test } from '@playwright/test'

// Next's route announcer is also an alert, so pick ours out by its text.
const errorAlert = (page: import('@playwright/test').Page) =>
  page.getByRole('alert').filter({ hasText: 'Something went wrong' })

test.describe('region pages', () => {
  test('show a region and its charts @mobile', async ({ page }) => {
    await page.goto('/regions/nzsi')

    await expect(page).toHaveTitle(
      'South Island rain & wind forecast | metvuw mobile',
    )
    await expect(
      page.getByRole('heading', { name: 'South Island', level: 1 }),
    ).toBeVisible()
    await expect(
      page.getByRole('img', { name: /south island forecast chart for .*/i }),
    ).toHaveCount(10)
  })
})

test.describe('pages that do not exist', () => {
  const showsNotFound = async (page: import('@playwright/test').Page) => {
    await expect(
      page.getByRole('heading', { name: 'Page not found' }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Go to the home page' }),
    ).toHaveAttribute('href', '/')
    // Search engines are told not to index it.
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
      'content',
      'noindex',
    )
  }

  test('an unknown path is a real 404 with a way home @mobile', async ({
    page,
  }) => {
    const response = await page.goto('/no-such-page')

    expect(response?.status()).toBe(404)
    await showsNotFound(page)
  })

  // These pages stream, so the status line is sent before `notFound()` runs and
  // it stays 200: the page says "not found" and is marked noindex instead.
  for (const [name, path] of [
    ['an unknown region', '/regions/atlantis'],
    ['an unknown radar code', '/radar/zz'],
    ['an unknown upper air station', '/upperair/00000'],
  ] as const) {
    test(`${name} shows the not-found page, marked noindex @mobile`, async ({
      page,
    }) => {
      await page.goto(path)

      await showsNotFound(page)
    })
  }
})

// The stub answers 502 for Estonia, as metvuw.com might during an outage.
test.describe('when metvuw.com fails', () => {
  test('shows the error state, not a crash or an empty page @mobile', async ({
    page,
  }) => {
    await page.goto('/regions/estonia')

    await expect(errorAlert(page)).toContainText('Something went wrong')
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('leaves the rest of the site working', async ({ page }) => {
    await page.goto('/regions/estonia')
    await expect(errorAlert(page)).toBeVisible()

    await page.goto('/regions/uk')

    await expect(
      page.getByRole('img', { name: /united kingdom forecast chart for .*/i }),
    ).toHaveCount(10)
  })
})
