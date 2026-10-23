import { expect, Page, test } from '@playwright/test'

// The first chart of a page is what it is measured by, so it goes alone: the others
// are asked for once it has loaded (or a few seconds on, if it never does).
const FIRST = '006.gif'
const isChart = (url: string) => url.includes('/api/fallback-image')

// Records when each chart is asked for, and holds the first one back (or fails it).
async function watchCharts(
  page: Page,
  first: { delayMs?: number; fail?: boolean },
) {
  const asked: { name: string; at: number }[] = []
  const start = Date.now()
  await page.route(
    (url) => isChart(url.href),
    async (route) => {
      const name = decodeURIComponent(route.request().url()).match(
        /(\d{3}\.gif)/,
      )![1]
      asked.push({ name, at: Date.now() - start })
      if (name === FIRST && first.fail) return route.abort()
      if (name === FIRST && first.delayMs) {
        await new Promise((resolve) => setTimeout(resolve, first.delayMs))
      }
      await route.continue()
    },
  )
  return { asked, since: () => Date.now() - start }
}

test.describe('loading the charts of a page', () => {
  test('asks for the first chart alone, and the rest once it has loaded', async ({
    page,
  }) => {
    const watch = await watchCharts(page, { delayMs: 1500 })

    await page.goto('/regions/nz', { waitUntil: 'commit' })
    await page.waitForTimeout(900)

    // The first chart is on its way, held up; nothing else has been asked for.
    expect(watch.asked.map((request) => request.name)).toEqual([FIRST])

    await expect
      .poll(() => new Set(watch.asked.map((request) => request.name)).size)
      .toBeGreaterThan(1)
    const first = watch.asked.find((request) => request.name === FIRST)!
    for (const request of watch.asked.filter((r) => r.name !== FIRST)) {
      expect(request.at).toBeGreaterThanOrEqual(first.at + 1400)
    }
  })

  test('still shows every chart, in the end @mobile', async ({ page }) => {
    await page.goto('/regions/nz')

    await expect
      .poll(() =>
        page.evaluate(
          () =>
            [...document.querySelectorAll<HTMLImageElement>('main img')].filter(
              (img) => img.complete && img.naturalWidth > 0,
            ).length,
        ),
      )
      .toBeGreaterThan(1)
  })

  test('goes on to the others when the first chart fails', async ({ page }) => {
    const watch = await watchCharts(page, { fail: true })

    await page.goto('/regions/nz')

    await expect
      .poll(() => watch.asked.some((request) => request.name !== FIRST))
      .toBe(true)
  })

  test('does not keep the others waiting for ever on a first chart that stalls', async ({
    page,
  }) => {
    const watch = await watchCharts(page, { delayMs: 7000 })

    await page.goto('/regions/nz', { waitUntil: 'commit' })
    await expect
      .poll(() => watch.asked.some((request) => request.name !== FIRST), {
        timeout: 6500,
      })
      .toBe(true)

    const others = watch.asked.filter((request) => request.name !== FIRST)
    // After the wait of four seconds, and before the first chart is done.
    expect(others[0].at).toBeGreaterThanOrEqual(3500)
    expect(others[0].at).toBeLessThan(6500)
  })

  test('has no address on the later charts in the page as the host sends it', async ({
    request,
  }) => {
    const html = await (await request.get('/regions/nz')).text()

    const images = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0])
    const charts = images.filter((tag) => /alt="[^"]*forecast chart/.test(tag))
    expect(charts.length).toBeGreaterThan(2)
    expect(charts[0]).toContain('src="/api/fallback-image')
    for (const tag of charts.slice(1)) expect(tag).not.toContain(' src=')
  })
})
