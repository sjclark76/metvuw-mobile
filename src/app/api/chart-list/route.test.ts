import { NextRequest } from 'next/server'

import { ChartList, chartListForPath } from '@/shared/helpers/offline/chartList'

import { GET, maxDuration } from './route'

vi.mock('@/shared/helpers/offline/chartList', () => ({
  chartListForPath: vi.fn(),
}))

const list: ChartList = {
  title: 'New Zealand',
  path: '/regions/nz',
  aliases: [],
  issued: 1000,
  urls: ['/api/fallback-image?a=1'],
}

const get = (query: string) =>
  GET(new NextRequest(`http://localhost:3002/api/chart-list${query}`))

describe('GET /api/chart-list', () => {
  beforeEach(() => vi.resetAllMocks())

  test('returns the charts on the page', async () => {
    vi.mocked(chartListForPath).mockResolvedValue(list)

    const response = await get('?path=%2Fregions%2Fnz')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(list)
    expect(chartListForPath).toHaveBeenCalledWith('/regions/nz')
  })

  test('is kept briefly by shared caches: the list changes with each run', async () => {
    vi.mocked(chartListForPath).mockResolvedValue(list)

    const response = await get('?path=%2Fregions%2Fnz')

    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=300',
    )
  })

  test('returns 400 when there is no path', async () => {
    const response = await get('')

    expect(response.status).toBe(400)
    expect(chartListForPath).not.toHaveBeenCalled()
  })

  test('returns 404 for a path that is not a chart page', async () => {
    vi.mocked(chartListForPath).mockResolvedValue(undefined)

    const response = await get('?path=%2Fabout')

    expect(response.status).toBe(404)
  })

  test('returns 503, briefly cached, when the page has no charts', async () => {
    vi.mocked(chartListForPath).mockResolvedValue({
      ...list,
      issued: undefined,
      urls: [],
    })

    const response = await get('?path=%2Fregions%2Fnz')

    expect(response.status).toBe(503)
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=30',
    )
  })

  // The page shows our chart, drawn in the page: no images, but dated.
  test('returns a list with no images when it has an issue time', async () => {
    vi.mocked(chartListForPath).mockResolvedValue({
      ...list,
      issued: 1000,
      urls: [],
    })

    const response = await get('?path=%2Fupperair%2F93844')

    expect(response.status).toBe(200)
    expect((await response.json()).urls).toEqual([])
  })

  test('returns 502, briefly cached, when the charts cannot be fetched', async () => {
    vi.mocked(chartListForPath).mockRejectedValue(new Error('upstream down'))

    const response = await get('?path=%2Fregions%2Fnz')

    expect(response.status).toBe(502)
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=30',
    )
  })

  // An upper air page's list waits for the balloon data, which can take Wyoming
  // 8 to 12 s; Vercel would stop the function at 10.
  test('may run for a minute', () => {
    expect(maxDuration).toBe(60)
  })
})
