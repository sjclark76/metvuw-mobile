import {
  collectGarbage,
  coversPath,
  downloadPage,
  expiredPages,
  refreshPage,
  sanitizeSavedPages,
  SAVED_CHARTS_CACHE,
  SAVED_LIFETIME_MS,
  SAVED_PAGES_CACHE,
  SavedPage,
} from './savedPages'

// Reading a body takes real time in a browser (disk, network); without that the
// concurrent downloads never interleave here, and a lost update could not show.
function slowBody(response: Response): Response {
  const blob = response.blob.bind(response)
  response.blob = async () => {
    await new Promise((resolve) => setTimeout(resolve, 2))
    return blob()
  }
  return response
}

// A just-enough Cache API: string-keyed, in memory.
class FakeCache {
  entries = new Map<string, Response>()
  async match(request: string | Request) {
    const held = this.entries.get(
      typeof request === 'string' ? request : request.url,
    )
    return held && slowBody(held.clone())
  }
  async put(request: string | Request, response: Response) {
    this.entries.set(
      typeof request === 'string' ? request : request.url,
      response,
    )
  }
  async keys() {
    return [...this.entries.keys()].map((url) => ({ url }) as Request)
  }
  async delete(request: string | Request) {
    return this.entries.delete(
      typeof request === 'string' ? request : request.url,
    )
  }
}
class FakeCaches {
  stores = new Map<string, FakeCache>()
  async open(name: string) {
    if (!this.stores.has(name)) this.stores.set(name, new FakeCache())
    return this.stores.get(name)!
  }
  cache(name: string) {
    return this.stores.get(name) ?? new FakeCache()
  }
  urls(name: string) {
    return [...this.cache(name).entries.keys()].sort()
  }
}

const chart = (n: number) => `/api/fallback-image?url=chart${n}&chartType=Rain`
const NOW = Date.UTC(2026, 9, 20, 12)
const CHART_BYTES = 10

interface World {
  /** What the list endpoint says for each path. */
  lists: Record<string, { title?: string; issued?: number; urls: string[] }>
  /** Paths or URLs that fail. */
  failing: Set<string>
  /** Pages that redirect elsewhere, as the home page does with a favourite set. */
  redirecting: Set<string>
  /** Pages that cannot be reached at all. */
  unreachable: Set<string>
  html: Record<string, string>
}

function setup(partial: Partial<World> = {}) {
  const world: World = {
    lists: {
      '/regions/nz': {
        title: 'New Zealand',
        issued: 100,
        urls: [chart(1), chart(2)],
      },
    },
    failing: new Set(),
    redirecting: new Set(),
    unreachable: new Set(),
    html: {
      '/regions/nz': '<html></html>',
      '/saved': '<html>saved</html>',
      '/pins': '<html>pins</html>',
      '/settings': '<html>settings</html>',
    },
    ...partial,
  }
  const requested: string[] = []
  let inFlight = 0
  let peak = 0

  const fetch = vi.fn(
    async (
      input: string | Request,
      init?: Parameters<typeof globalThis.fetch>[1],
    ) => {
      const url = typeof input === 'string' ? input : input.url
      requested.push(url)
      // Asked not to follow redirects: a page that redirects answers as one.
      if (init?.redirect === 'manual') {
        if (world.redirecting.has(url)) {
          return {
            type: 'opaqueredirect',
            ok: false,
            status: 0,
            body: null,
          } as unknown as Response
        }
        if (world.unreachable.has(url)) throw new TypeError('offline')
      }
      inFlight++
      peak = Math.max(peak, inFlight)
      await new Promise((resolve) => setTimeout(resolve, 1))
      inFlight--
      if (world.failing.has(url)) return new Response('no', { status: 503 })

      if (url.startsWith('/api/chart-list')) {
        const path = decodeURIComponent(url.split('path=')[1])
        const list = world.lists[path]
        if (!list) return new Response('{}', { status: 404 })
        return Response.json({ path, title: 'Page', ...list })
      }
      if (url.startsWith('/api/fallback-image')) {
        return slowBody(new Response('x'.repeat(CHART_BYTES), { status: 200 }))
      }
      if (world.html[url] !== undefined) {
        const page = new Response(world.html[url])
        // Followed to wherever it redirects, a browser says it was redirected.
        if (world.redirecting.has(url)) {
          Object.defineProperty(page, 'redirected', { value: true })
        }
        return page
      }
      return new Response('asset', { status: 200 })
    },
  )

  const caches = new FakeCaches()
  const deps = {
    fetch: fetch as unknown as typeof globalThis.fetch,
    caches: caches as unknown as CacheStorage,
    now: () => NOW,
  }
  return { world, fetch, caches, deps, requested, peak: () => peak }
}

const page = (overrides: Partial<SavedPage> = {}): SavedPage => ({
  path: '/regions/nz',
  aliases: [],
  title: 'New Zealand',
  issued: 100,
  refreshedAt: NOW,
  urls: [chart(1), chart(2)],
  bytes: 20,
  ...overrides,
})

describe('downloadPage', () => {
  test('keeps every chart and the page, and describes what it kept', async () => {
    const { deps, caches } = setup()

    const saved = await downloadPage('/regions/nz', deps)

    expect(saved).toEqual({
      path: '/regions/nz',
      aliases: [],
      title: 'New Zealand',
      issued: 100,
      refreshedAt: NOW,
      urls: [chart(1), chart(2)],
      bytes: 2 * CHART_BYTES,
    })
    expect(caches.urls(SAVED_CHARTS_CACHE)).toEqual([chart(1), chart(2)])
    expect(caches.urls(SAVED_PAGES_CACHE)).toContain('/regions/nz')
  })

  test('also keeps the list of saved pages, the Places page and Settings, so all open offline', async () => {
    const { deps, caches } = setup()

    await downloadPage('/regions/nz', deps)

    expect(caches.urls(SAVED_PAGES_CACHE)).toEqual([
      '/pins',
      '/regions/nz',
      '/saved',
      '/settings',
    ])
  })

  test('saving still works when the list of saved pages cannot be kept', async () => {
    const { deps, caches } = setup({ failing: new Set(['/saved']) })

    await expect(downloadPage('/regions/nz', deps)).resolves.toBeDefined()
    expect(caches.urls(SAVED_PAGES_CACHE)).toEqual([
      '/pins',
      '/regions/nz',
      '/settings',
    ])
  })

  test('saving still works when the Places page cannot be kept', async () => {
    const { deps, caches } = setup({ failing: new Set(['/pins']) })

    await expect(downloadPage('/regions/nz', deps)).resolves.toBeDefined()
    expect(caches.urls(SAVED_PAGES_CACHE)).toEqual([
      '/regions/nz',
      '/saved',
      '/settings',
    ])
  })

  test('saving still works when the Settings page cannot be kept', async () => {
    const { deps, caches } = setup({ failing: new Set(['/settings']) })

    await expect(downloadPage('/regions/nz', deps)).resolves.toBeDefined()
    expect(caches.urls(SAVED_PAGES_CACHE)).toEqual([
      '/pins',
      '/regions/nz',
      '/saved',
    ])
  })

  test('fails, and says so, when one chart cannot be downloaded', async () => {
    const { deps } = setup({ failing: new Set([chart(2)]) })

    await expect(downloadPage('/regions/nz', deps)).rejects.toThrow()
  })

  test('fails when the page itself cannot be downloaded', async () => {
    const { deps } = setup({ failing: new Set(['/regions/nz']) })

    await expect(downloadPage('/regions/nz', deps)).rejects.toThrow()
  })

  test('fails when the page redirects, as a redirected page cannot be shown offline', async () => {
    const { deps, fetch } = setup()
    const original = fetch.getMockImplementation()!
    fetch.mockImplementation(async (input) => {
      const response = await original(input)
      if ((typeof input === 'string' ? input : input.url) === '/regions/nz') {
        Object.defineProperty(response, 'redirected', { value: true })
      }
      return response
    })

    await expect(downloadPage('/regions/nz', deps)).rejects.toThrow()
  })

  test('fails when the page has no list of charts', async () => {
    const { deps } = setup()

    await expect(downloadPage('/regions/atlantis', deps)).rejects.toThrow()
  })

  test('will not fetch anything but the proxied charts it is told about', async () => {
    const { deps, requested } = setup({
      lists: {
        '/regions/nz': {
          urls: [chart(1), 'https://evil.example/x.png', '/api/other?x=1'],
        },
      },
    })

    await expect(downloadPage('/regions/nz', deps)).rejects.toThrow()

    expect(requested).not.toContain('https://evil.example/x.png')
    expect(requested).not.toContain('/api/other?x=1')
  })

  test('does not download a chart it already holds again', async () => {
    const { deps, requested } = setup()
    await downloadPage('/regions/nz', deps)
    requested.length = 0

    const again = await downloadPage('/regions/nz', deps)

    expect(requested.filter((url) => url.startsWith('/api/fallback'))).toEqual(
      [],
    )
    expect(again.bytes).toBe(2 * CHART_BYTES)
  })

  test("adds up every chart's size, however many are downloaded at once", async () => {
    const urls = Array.from({ length: 30 }, (_, i) => chart(i))
    const { deps } = setup({ lists: { '/regions/nz': { urls } } })

    const saved = await downloadPage('/regions/nz', deps)
    const again = await downloadPage('/regions/nz', deps)

    expect(saved.bytes).toBe(30 * CHART_BYTES)
    expect(again.bytes).toBe(30 * CHART_BYTES)
  })

  test('asks for a few charts at a time, not all at once', async () => {
    const urls = Array.from({ length: 30 }, (_, i) => chart(i))
    const { deps, peak } = setup({ lists: { '/regions/nz': { urls } } })

    await downloadPage('/regions/nz', deps)

    expect(peak()).toBeLessThanOrEqual(4)
    expect(peak()).toBeGreaterThan(1)
  })

  test('also fetches the scripts and styles the page names, so it can open offline', async () => {
    const { deps, requested } = setup({
      html: {
        '/regions/nz':
          '<script src="/_next/static/chunks/page-abc.js"></script><link href="/_next/static/css/app-def.css"><a href="https://other.example/x.js">',
      },
    })

    await downloadPage('/regions/nz', deps)

    expect(requested).toContain('/_next/static/chunks/page-abc.js')
    expect(requested).toContain('/_next/static/css/app-def.css')
    expect(requested).not.toContain('https://other.example/x.js')
  })

  test('a script that will not download does not stop the page being saved', async () => {
    const { deps } = setup({
      html: { '/regions/nz': '<script src="/_next/static/chunks/a.js">' },
      failing: new Set(['/_next/static/chunks/a.js']),
    })

    await expect(downloadPage('/regions/nz', deps)).resolves.toBeDefined()
  })
})

describe('refreshPage', () => {
  test('only confirms a page whose charts have not changed, and downloads nothing', async () => {
    const { deps, requested } = setup()
    const saved = await downloadPage('/regions/nz', deps)
    requested.length = 0
    const later = { ...deps, now: () => NOW + 60_000 }

    const refreshed = await refreshPage(saved, later)

    expect(refreshed).toEqual({ ...saved, refreshedAt: NOW + 60_000 })
    expect(requested).toEqual(['/api/chart-list?path=%2Fregions%2Fnz'])
  })

  // A page showing the balloon's chart in the page itself has no images; what
  // says it is current is the balloon's launch time.
  test('saves a page with no images, which is dated', async () => {
    const { deps, requested } = setup({
      lists: { '/upperair/93844': { issued: 500, urls: [] } },
      html: { '/upperair/93844': '<html>chart</html>' },
    })

    const saved = await downloadPage('/upperair/93844', deps)

    expect(saved.urls).toEqual([])
    expect(saved.issued).toBe(500)
    expect(requested.filter((url) => url.startsWith('/api/fallback'))).toEqual(
      [],
    )
  })

  test('refreshes a page with no images when a new balloon has flown, downloading no images', async () => {
    const { deps, world, requested } = setup({
      lists: { '/upperair/93844': { issued: 500, urls: [] } },
      html: { '/upperair/93844': '<html>chart</html>' },
    })
    const saved = await downloadPage('/upperair/93844', deps)
    world.lists['/upperair/93844'] = { issued: 900, urls: [] }
    requested.length = 0

    const refreshed = await refreshPage(saved, deps)

    expect(refreshed.issued).toBe(900)
    expect(requested.filter((url) => url.startsWith('/api/fallback'))).toEqual(
      [],
    )
  })

  // When the balloon data can't be had, the page's list falls back to metvuw's
  // old charts: an older date than the saved page's, which must not replace it.
  test('does not replace a page with an older list, as when the balloon data failed', async () => {
    const { deps, world, requested } = setup({
      lists: { '/upperair/93844': { issued: 900, urls: [] } },
      html: { '/upperair/93844': '<html>chart</html>' },
    })
    const saved = await downloadPage('/upperair/93844', deps)
    world.lists['/upperair/93844'] = { issued: 100, urls: [chart(1)] }
    requested.length = 0

    const refreshed = await refreshPage(saved, deps)

    expect(refreshed.issued).toBe(900)
    expect(refreshed.urls).toEqual([])
    expect(requested).toEqual(['/api/chart-list?path=%2Fupperair%2F93844'])
  })

  test('replaces the charts when there is a new run, downloading only the new ones', async () => {
    const { deps, world, requested } = setup()
    const saved = await downloadPage('/regions/nz', deps)
    world.lists['/regions/nz'] = {
      title: 'New Zealand',
      issued: 200,
      urls: [chart(2), chart(3)],
    }
    requested.length = 0

    const refreshed = await refreshPage(saved, deps)

    expect(refreshed.urls).toEqual([chart(2), chart(3)])
    expect(refreshed.issued).toBe(200)
    expect(requested.filter((url) => url.startsWith('/api/fallback'))).toEqual([
      chart(3),
    ])
  })

  test('leaves the saved page as it was when the refresh fails', async () => {
    const { deps, world } = setup()
    const saved = await downloadPage('/regions/nz', deps)
    world.lists['/regions/nz'] = { issued: 200, urls: [chart(7)] }
    world.failing.add(chart(7))

    await expect(refreshPage(saved, deps)).rejects.toThrow()
  })

  test('never replaces a saved page with an empty one', async () => {
    const { deps, world } = setup()
    const saved = await downloadPage('/regions/nz', deps)
    world.failing.add('/api/chart-list?path=%2Fregions%2Fnz')

    await expect(refreshPage(saved, deps)).rejects.toThrow()
  })
})

describe('collectGarbage', () => {
  test('deletes charts and pages that no saved page needs any more', async () => {
    const { deps, caches } = setup()
    await downloadPage('/regions/nz', deps)
    const nz = await (await caches.open(SAVED_CHARTS_CACHE)).keys()
    expect(nz).toHaveLength(2)

    await collectGarbage([], deps)

    expect(caches.urls(SAVED_CHARTS_CACHE)).toEqual([])
    // Only the list of saved pages, the Places page and Settings stay: they are not
    // any one page's.
    expect(caches.urls(SAVED_PAGES_CACHE)).toEqual([
      '/pins',
      '/saved',
      '/settings',
    ])
  })

  test('keeps what is still used, including a chart two pages share', async () => {
    const { deps, caches } = setup()
    await downloadPage('/regions/nz', deps)
    const charts = await caches.open(SAVED_CHARTS_CACHE)
    await charts.put(chart(9), new Response('x'))
    const pages = await caches.open(SAVED_PAGES_CACHE)
    await pages.put('/satellite', new Response('s'))

    await collectGarbage(
      [
        page({ urls: [chart(1)] }),
        page({ path: '/satellite', urls: [chart(1), chart(2)] }),
      ],
      deps,
    )

    expect(caches.urls(SAVED_CHARTS_CACHE)).toEqual([chart(1), chart(2)])
    expect(caches.urls(SAVED_PAGES_CACHE)).toEqual([
      '/pins',
      '/regions/nz',
      '/satellite',
      '/saved',
      '/settings',
    ])
  })

  test('tidies up a refresh that stopped part way', async () => {
    const { deps, caches, world } = setup()
    const saved = await downloadPage('/regions/nz', deps)
    world.lists['/regions/nz'] = {
      issued: 200,
      urls: [chart(5), chart(6)],
    }
    world.failing.add(chart(6))
    await refreshPage(saved, deps).catch(() => {})
    expect(caches.urls(SAVED_CHARTS_CACHE)).toContain(chart(5))

    await collectGarbage([saved], deps)

    expect(caches.urls(SAVED_CHARTS_CACHE)).toEqual([chart(1), chart(2)])
  })
})

describe('a page with more than one address', () => {
  const twoAddresses = () =>
    setup({
      lists: {
        '/': {
          title: 'New Zealand',
          issued: 100,
          urls: [chart(1)],
          // What the endpoint answers for the home page.
          ...{ path: '/regions/nz', aliases: ['/'] },
        },
      },
      html: { '/': '<html>home</html>', '/regions/nz': '<html>nz</html>' },
    })

  test('keeps the page under every address, and records them', async () => {
    const { deps, caches } = twoAddresses()

    const saved = await downloadPage('/', deps)

    expect(saved.path).toBe('/regions/nz')
    expect(saved.aliases).toEqual(['/'])
    expect(caches.urls(SAVED_PAGES_CACHE)).toEqual(
      expect.arrayContaining(['/', '/regions/nz']),
    )
  })

  test('is still saved when another address cannot be kept', async () => {
    const { deps, world, caches } = twoAddresses()
    world.failing.add('/')

    const saved = await downloadPage('/', deps)

    expect(saved.path).toBe('/regions/nz')
    expect(caches.urls(SAVED_PAGES_CACHE)).toContain('/regions/nz')
    expect(caches.urls(SAVED_PAGES_CACHE)).not.toContain('/')
  })

  test('collectGarbage keeps every address of a saved page', async () => {
    const { deps, caches } = twoAddresses()
    const saved = await downloadPage('/', deps)

    await collectGarbage([saved], deps)

    expect(caches.urls(SAVED_PAGES_CACHE)).toEqual(
      expect.arrayContaining(['/', '/regions/nz']),
    )
  })

  test('coversPath is true for the page and for each of its addresses', () => {
    const nz = page({ path: '/regions/nz', aliases: ['/'] })

    expect(coversPath(nz, '/regions/nz')).toBe(true)
    expect(coversPath(nz, '/')).toBe(true)
    expect(coversPath(nz, '/satellite')).toBe(false)
    expect(coversPath(page({ path: '/satellite' }), '/')).toBe(false)
  })

  test('sanitising keeps good addresses and drops the rest', () => {
    const kept = sanitizeSavedPages([
      page({ path: '/a', aliases: ['/', '//evil.example', 'x', 7 as never] }),
    ])

    expect(kept[0].aliases).toEqual(['/'])
  })

  test('a saved page with no addresses recorded has none', () => {
    const { aliases: _unused, ...old } = page({ path: '/a' })
    void _unused

    expect(sanitizeSavedPages([old])[0].aliases).toEqual([])
  })
})

describe("keeping a page's other addresses true", () => {
  const nz = {
    '/': '<html>home</html>',
    '/regions/nz': '<html>nz</html>',
  }
  const setupNz = () =>
    setup({
      lists: {
        '/regions/nz': {
          title: 'New Zealand',
          issued: 100,
          urls: [chart(1)],
          ...{ path: '/regions/nz', aliases: ['/'] },
        },
      },
      html: nz,
    })

  test('drops an address that has since started to redirect: the visitor chose another home page', async () => {
    const { deps, world, caches } = setupNz()
    const saved = await downloadPage('/regions/nz', deps)
    expect(saved.aliases).toEqual(['/'])
    world.redirecting.add('/')

    const refreshed = await refreshPage(saved, deps)
    await collectGarbage([refreshed], deps)

    expect(refreshed.aliases).toEqual([])
    expect(caches.urls(SAVED_PAGES_CACHE)).not.toContain('/')
  })

  test('adds an address that has since stopped redirecting, and keeps its page', async () => {
    const { deps, world, caches } = setupNz()
    world.redirecting.add('/')
    const saved = await downloadPage('/regions/nz', deps)
    expect(saved.aliases).toEqual([])
    world.redirecting.delete('/')

    const refreshed = await refreshPage(saved, deps)

    expect(refreshed.aliases).toEqual(['/'])
    expect(caches.urls(SAVED_PAGES_CACHE)).toContain('/')
  })

  test('leaves addresses as they were when it cannot be checked', async () => {
    const { deps, world } = setupNz()
    const saved = await downloadPage('/regions/nz', deps)
    world.unreachable.add('/')

    const refreshed = await refreshPage(saved, deps)

    expect(refreshed.aliases).toEqual(['/'])
  })

  test('does not download a whole page just to see whether it redirects', async () => {
    const { deps, requested, fetch } = setupNz()
    const saved = await downloadPage('/regions/nz', deps)
    requested.length = 0
    fetch.mockClear()

    await refreshPage(saved, deps)

    const checks = fetch.mock.calls.filter(([url]) => url === '/')
    expect(checks).toHaveLength(1)
    expect(checks[0][1]).toMatchObject({
      redirect: 'manual',
      cache: 'no-store',
    })
  })

  test('a page with no other addresses makes no such check', async () => {
    const { deps, requested } = setup()
    const saved = await downloadPage('/regions/nz', deps)
    requested.length = 0

    await refreshPage(saved, deps)

    expect(requested).toEqual(['/api/chart-list?path=%2Fregions%2Fnz'])
  })
})

describe('expiredPages', () => {
  test('a page expires seven days after it was last refreshed', () => {
    const fresh = page({ path: '/a', refreshedAt: NOW - SAVED_LIFETIME_MS + 1 })
    const stale = page({ path: '/b', refreshedAt: NOW - SAVED_LIFETIME_MS - 1 })

    expect(expiredPages([fresh, stale], NOW)).toEqual([stale])
  })

  test('is seven days exactly', () => {
    expect(SAVED_LIFETIME_MS).toBe(7 * 24 * 60 * 60 * 1000)
  })
})

describe('sanitizeSavedPages', () => {
  test('keeps well-formed pages, in order', () => {
    const a = page({ path: '/a' })
    const b = page({ path: '/b', issued: undefined })

    expect(sanitizeSavedPages([a, b])).toEqual([a, b])
  })

  test.each([undefined, null, 'x', 7, {}, { 0: page() }])(
    'is empty when what was stored is %j, not a list',
    (stored) => {
      expect(sanitizeSavedPages(stored)).toEqual([])
    },
  )

  test('drops entries that are not saved pages, and keeps the rest', () => {
    const good = page({ path: '/good' })

    expect(
      sanitizeSavedPages([
        null,
        'x',
        { ...good, path: 'no-slash' },
        { ...good, path: '//evil.example' },
        { ...good, title: 3 },
        { ...good, refreshedAt: 'yesterday' },
        { ...good, refreshedAt: Infinity },
        { ...good, bytes: '1MB' },
        { ...good, urls: 'x' },
        { ...good, urls: ['https://evil.example/x.png'] },
        good,
      ]),
    ).toEqual([good])
  })

  test('keeps one entry for a page saved twice', () => {
    const first = page({ refreshedAt: 1 })
    const second = page({ refreshedAt: 2 })

    expect(sanitizeSavedPages([first, second])).toEqual([first])
  })
})
