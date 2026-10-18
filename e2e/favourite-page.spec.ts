import { expect, test } from '@playwright/test'

const homeStatus = async (
  context: import('@playwright/test').BrowserContext,
) => {
  const response = await context.request.get('/', { maxRedirects: 0 })
  return { status: response.status(), location: response.headers()['location'] }
}

// A favourite page is redirected by the proxy before the home page renders,
// instead of after the home page has downloaded and hydrated.
test.describe('favourite page', () => {
  test('the home page is served as normal without a favourite', async ({
    context,
  }) => {
    expect((await homeStatus(context)).status).toBe(200)
  })

  test('setting a favourite makes the proxy redirect the home page', async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/regions/nzsi')
    await page.getByLabel('Use this page as my home page').click()

    await expect.poll(async () => (await homeStatus(context)).status).toBe(307)
    expect((await homeStatus(context)).location).toMatch(/\/regions\/nzsi$/)
  })

  test('opening the app lands on the favourite without rendering the home page', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/regions/nzsi')
    await page.getByLabel('Use this page as my home page').click()
    await expect(
      page.getByLabel('Use this page as my home page'),
    ).toHaveAttribute('aria-pressed', 'true')

    const redirects: number[] = []
    page.on('response', (response) => {
      // Only the page navigation: the logo links home, so the app may also
      // prefetch '/' once it has loaded.
      if (
        response.request().isNavigationRequest() &&
        new URL(response.url()).pathname === '/'
      ) {
        redirects.push(response.status())
      }
    })
    await page.goto('/')

    await expect(page).toHaveURL(/\/regions\/nzsi$/)
    expect(redirects).toEqual([307])
  })

  // The installed app launches at '/', through its service worker.
  test('the installed app, with its service worker in control, still lands on the favourite', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/regions/nzsi')
    await page.getByLabel('Use this page as my home page').click()
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) =>
          navigator.serviceWorker.addEventListener('controllerchange', resolve),
        )
      }
    })

    await page.goto('/')

    await expect(page).toHaveURL(/\/regions\/nzsi$/)
    await expect(
      page.getByLabel('Use this page as my home page'),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  test('unsetting it brings the home page back', async ({ page, context }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/regions/nzsi')
    const button = page.getByLabel('Use this page as my home page')
    await button.click()
    await expect.poll(async () => (await homeStatus(context)).status).toBe(307)

    await button.click()

    await expect.poll(async () => (await homeStatus(context)).status).toBe(200)
  })

  test('a favourite saved before the cookie existed gets one on its next visit', async ({
    page,
    context,
  }) => {
    await page.addInitScript(() =>
      localStorage.setItem('favoritePage', JSON.stringify('/radar/nl')),
    )
    await page.goto('/satellite')

    await expect
      .poll(async () => (await homeStatus(context)).location)
      .toMatch(/\/radar\/nl$/)
  })

  test('a tampered cookie cannot send the home page elsewhere', async ({
    context,
    baseURL,
  }) => {
    for (const value of [
      '//evil.example',
      '/\\evil.example',
      'https://evil.example',
    ]) {
      await context.addCookies([
        {
          name: 'favorite-page',
          value: encodeURIComponent(value),
          url: baseURL!,
        },
      ])

      const { status, location } = await homeStatus(context)

      expect(status, value).toBe(200)
      expect(location, value).toBeUndefined()
    }
  })
})
