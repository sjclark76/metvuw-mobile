import {
  SAVED_CHARTS_CACHE,
  SAVED_PAGES_CACHE,
} from '@/shared/helpers/offline/savedPages'

import { savedChart, savedPage } from './swSavedPages'

// Just enough of the Cache API to look a request up, ignoring the query string
// when asked, the way the real one does.
function cachesWith(contents: Record<string, Record<string, string>>) {
  return {
    async open(name: string) {
      return {
        async match(
          request: Request,
          options?: { ignoreSearch?: boolean },
        ): Promise<Response | undefined> {
          const url = new URL(request.url)
          const key = Object.keys(contents[name] ?? {}).find((stored) => {
            const candidate = new URL(stored, 'https://metvuw.test')
            return options?.ignoreSearch
              ? candidate.pathname === url.pathname
              : candidate.pathname + candidate.search ===
                  url.pathname + url.search
          })
          return key === undefined
            ? undefined
            : new Response(contents[name][key])
        },
      }
    },
  } as unknown as CacheStorage
}

const request = (path: string) => new Request(`https://metvuw.test${path}`)
const chartPath = '/api/fallback-image?url=a&chartType=Rain'

describe('savedChart', () => {
  test('finds a chart that was saved', async () => {
    const caches = cachesWith({
      [SAVED_CHARTS_CACHE]: { [chartPath]: 'image' },
    })

    const found = await savedChart(request(chartPath), caches)

    expect(await found?.text()).toBe('image')
  })

  test('finds nothing for a chart that was not saved', async () => {
    const caches = cachesWith({ [SAVED_CHARTS_CACHE]: { [chartPath]: 'x' } })

    expect(
      await savedChart(
        request('/api/fallback-image?url=b&chartType=Rain'),
        caches,
      ),
    ).toBeUndefined()
  })

  test('a chart is its whole address: another variant is another chart', async () => {
    const caches = cachesWith({ [SAVED_CHARTS_CACHE]: { [chartPath]: 'x' } })

    expect(
      await savedChart(request(`${chartPath}&variant=small`), caches),
    ).toBeUndefined()
  })

  test('does not look in the pages', async () => {
    const caches = cachesWith({ [SAVED_PAGES_CACHE]: { [chartPath]: 'x' } })

    expect(await savedChart(request(chartPath), caches)).toBeUndefined()
  })
})

describe('savedPage', () => {
  test('finds a page that was saved', async () => {
    const caches = cachesWith({
      [SAVED_PAGES_CACHE]: { '/regions/nz': '<html>nz</html>' },
    })

    const found = await savedPage(request('/regions/nz'), caches)

    expect(await found?.text()).toBe('<html>nz</html>')
  })

  test('finds it whatever query string the link carried', async () => {
    const caches = cachesWith({
      [SAVED_PAGES_CACHE]: { '/regions/nz': '<html>nz</html>' },
    })

    const found = await savedPage(
      request('/regions/nz?utm_source=newsletter'),
      caches,
    )

    expect(await found?.text()).toBe('<html>nz</html>')
  })

  test('finds nothing for a page that was not saved', async () => {
    const caches = cachesWith({
      [SAVED_PAGES_CACHE]: { '/regions/nz': 'x' },
    })

    expect(await savedPage(request('/satellite'), caches)).toBeUndefined()
  })

  test('does not look in the charts', async () => {
    const caches = cachesWith({ [SAVED_CHARTS_CACHE]: { '/satellite': 'x' } })

    expect(await savedPage(request('/satellite'), caches)).toBeUndefined()
  })
})
