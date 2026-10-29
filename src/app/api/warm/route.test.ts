import { NextRequest } from 'next/server'

import sitemap from '@/app/sitemap'
import { chartListForPath } from '@/shared/helpers/offline/chartList'

import { POST } from './route'

vi.mock('@/app/sitemap', () => ({ default: vi.fn() }))
vi.mock('@/shared/helpers/offline/chartList', () => ({
  chartListForPath: vi.fn(),
}))

const fetchMock = vi.fn()

const post = (token?: string, query = '') =>
  POST(
    new NextRequest(`https://www.example.com/api/warm${query}`, {
      method: 'POST',
      headers: token ? { 'x-warm-token': token } : {},
    }),
  )

describe('POST /api/warm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubEnv('WARM_SECRET', 'secret')
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockResolvedValue(new Response('ok'))
    vi.mocked(sitemap).mockReturnValue([
      { url: 'https://metvuwmobile.com/regions/nz' },
      { url: 'https://metvuwmobile.com/radar/nz' },
    ])
    vi.mocked(chartListForPath).mockImplementation(async (path) => ({
      title: path,
      path,
      aliases: [],
      issued: 0,
      urls: [`/api/fallback-image?page=${path}`, '/api/fallback-image?later'],
    }))
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  test('refuses a request without the token', async () => {
    const response = await post()

    expect(response.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('refuses a request with the wrong token', async () => {
    const response = await post('guess')

    expect(response.status).toBe(401)
  })

  test('refuses every request when no secret is set', async () => {
    vi.stubEnv('WARM_SECRET', '')

    const response = await post('')

    expect(response.status).toBe(401)
  })

  test('requests every sitemap page and its first chart, on the origin it was called on', async () => {
    const response = await post('secret')

    const fetched = fetchMock.mock.calls.map(([url]) => String(url))
    expect(fetched).toEqual(
      expect.arrayContaining([
        'https://www.example.com/regions/nz',
        'https://www.example.com/radar/nz',
        'https://www.example.com/api/fallback-image?page=/regions/nz',
        'https://www.example.com/api/fallback-image?page=/radar/nz',
      ]),
    )
    expect(fetched).not.toContain(
      'https://www.example.com/api/fallback-image?later',
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      ok: true,
      warmed: 4,
      failed: [],
      next: null,
    })
  })

  test('reports the pages that failed, and carries on with the rest', async () => {
    fetchMock.mockImplementation(async (url) =>
      String(url) === 'https://www.example.com/regions/nz'
        ? new Response('down', { status: 502 })
        : new Response('ok'),
    )

    const response = await post('secret')

    expect(await response.json()).toEqual({
      ok: false,
      warmed: 3,
      failed: ['/regions/nz 502'],
      next: null,
    })
  })

  test('warms the page even when its chart list cannot be read', async () => {
    vi.mocked(chartListForPath).mockRejectedValue(new Error('metvuw down'))

    const response = await post('secret')

    expect(await response.json()).toEqual({
      ok: false,
      warmed: 2,
      failed: ['/regions/nz charts', '/radar/nz charts'],
      next: null,
    })
  })

  describe('within the 60 s a function is allowed', () => {
    const tenPages = Array.from({ length: 10 }, (_, n) => ({
      url: `https://metvuwmobile.com/regions/r${n}`,
    }))

    afterEach(() => vi.useRealTimers())

    test('carries on from the page it is given', async () => {
      vi.mocked(sitemap).mockReturnValue(tenPages)

      const response = await post('secret', '?from=8')

      const pages = fetchMock.mock.calls
        .map(([url]) => String(url))
        .filter((url) => !url.includes('fallback-image'))
      expect(pages).toEqual([
        'https://www.example.com/regions/r8',
        'https://www.example.com/regions/r9',
      ])
      expect((await response.json()).next).toBeNull()
    })

    test('stops starting pages when its time is up, and says where to carry on', async () => {
      vi.useFakeTimers()
      vi.mocked(sitemap).mockReturnValue(tenPages)
      // Each page takes 20 s, so the time is up after the first four.
      fetchMock.mockImplementation(async (url) => {
        if (!String(url).includes('fallback-image')) {
          vi.setSystemTime(Date.now() + 20_000)
        }
        return new Response('ok')
      })

      const response = await post('secret')

      expect(await response.json()).toMatchObject({ next: 4 })
    })

    test('reports a page that takes too long, and does not wait for it', async () => {
      vi.useFakeTimers()
      fetchMock.mockImplementation(async (url) =>
        String(url) === 'https://www.example.com/regions/nz'
          ? new Promise(() => {})
          : new Response('ok'),
      )

      const responding = post('secret')
      await vi.advanceTimersByTimeAsync(15_000)
      const response = await responding

      expect(await response.json()).toEqual({
        ok: false,
        warmed: 2,
        failed: ['/regions/nz timed out'],
        next: null,
      })
    })
  })
})
