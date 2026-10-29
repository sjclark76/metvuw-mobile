import { NextRequest } from 'next/server'

import sitemap from '@/app/sitemap'
import { chartListForPath } from '@/shared/helpers/offline/chartList'

import { POST } from './route'

vi.mock('@/app/sitemap', () => ({ default: vi.fn() }))
vi.mock('@/shared/helpers/offline/chartList', () => ({
  chartListForPath: vi.fn(),
}))

const fetchMock = vi.fn()

const post = (token?: string) =>
  POST(
    new NextRequest('https://www.example.com/api/warm', {
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
    expect(await response.json()).toEqual({ ok: true, warmed: 4, failed: [] })
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
    })
  })

  test('warms the page even when its chart list cannot be read', async () => {
    vi.mocked(chartListForPath).mockRejectedValue(new Error('metvuw down'))

    const response = await post('secret')

    expect(await response.json()).toEqual({
      ok: false,
      warmed: 2,
      failed: ['/regions/nz charts', '/radar/nz charts'],
    })
  })
})
