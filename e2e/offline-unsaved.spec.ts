import { expect, Page, test } from '@playwright/test'

// A page that was not saved for offline use must not open with no connection as
// the forecast page without its styles. On an iPhone the installed app does not
// keep the files of an old build, so a page kept from a visit before an update
// had nothing to be styled by. A page that is not saved is the offline page, which
// is always current and always has what it needs.

// Service workers only exist in the production build.
test.use({ serviceWorkers: 'allow' })

// Chromium is the engine that applies offline emulation to the worker's traffic.
test.skip(
  ({ browserName }) => browserName !== 'chromium',
  'needs Chromium network emulation',
)

async function openControlled(page: Page, path: string) {
  await page.goto(path)
  await page.waitForSelector('main img')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', resolve),
      )
    }
  })
  // The worker only handles what loads after it took control.
  await page.reload()
  await page.waitForSelector('main img')
}

// What a visit before an update left behind: the page as it was then, pointing at
// a stylesheet that is no longer anywhere.
async function pointCachedPagesAtAStylesheetThatIsGone(page: Page) {
  await page.evaluate(async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith('serwist-precache')) continue
      const cache = await caches.open(name)
      for (const request of await cache.keys()) {
        const response = await cache.match(request)
        if (!response?.headers.get('content-type')?.includes('text/html')) {
          continue
        }
        const html = (await response.text()).replace(
          /\/_next\/static\/css\/[\w-]+\.css/g,
          '/_next/static/css/gone-0000000000000000.css',
        )
        await cache.put(
          request,
          new Response(html, { headers: response.headers }),
        )
      }
    }
  })
}

test.describe('a page that was not saved, with no connection', () => {
  test('is the offline page, styled, even when the page was viewed before', async ({
    page,
    context,
  }) => {
    await openControlled(page, '/regions/nz')
    await pointCachedPagesAtAStylesheetThatIsGone(page)
    // The browser's own cache would hide a missing file.
    const session = await context.newCDPSession(page)
    await session.send('Network.setCacheDisabled', { cacheDisabled: true })
    await context.setOffline(true)

    await page.reload().catch(() => {})

    await expect(
      page.getByRole('heading', { name: "You're offline" }),
    ).toBeVisible()
    // Styled: the chart-paper background, not the browser's white.
    await expect(page.locator('body')).toHaveCSS(
      'background-color',
      'rgb(230, 230, 250)',
    )
  })
})
