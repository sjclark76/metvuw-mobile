import { buildFallbackImageProxyUrl } from '@/shared/helpers/dataSource/fallbackImageProxyUrl'
import {
  getRadarChartDataForCode,
  getRainChartDataForRegion,
  getSatelliteChartData,
  getUpperAirChartDataForCode,
} from '@/shared/helpers/dataSource/getWeatherChartData'
import {
  type FetchedSounding,
  fetchSounding,
} from '@/shared/helpers/sounding/fetchSounding'
import { ChartType } from '@/shared/types/ChartType'

import { chartListForPath } from './chartList'

vi.mock('@/shared/helpers/dataSource/getWeatherChartData', () => ({
  getRainChartDataForRegion: vi.fn(),
  getRadarChartDataForCode: vi.fn(),
  getSatelliteChartData: vi.fn(),
  getUpperAirChartDataForCode: vi.fn(),
}))

vi.mock('@/shared/helpers/sounding/fetchSounding', () => ({
  fetchSounding: vi.fn(),
}))

const balloon = (launchUTC: number) =>
  ({
    launchUTC,
    sounding: { levels: [] },
    sourceUrl: 'https://weather.uwyo.edu/x',
  }) as unknown as FetchedSounding

const proxy = (name: string, chartType: ChartType) =>
  buildFallbackImageProxyUrl({
    sourceUrl: `https://www.metvuw.com/${name}.gif`,
    chartType,
  })
const small = (name: string, chartType: ChartType) =>
  buildFallbackImageProxyUrl({
    sourceUrl: `https://www.metvuw.com/${name}.gif`,
    chartType,
    variant: 'small',
  })

const chart = (url: string, imageDateUTC: number) => ({ url, imageDateUTC })

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(fetchSounding).mockResolvedValue(undefined)
})

describe('chartListForPath', () => {
  test('lists a region page: its title, when it was issued, and every chart', async () => {
    vi.mocked(getRainChartDataForRegion).mockResolvedValue([
      { ...chart(proxy('a', 'Rain'), 1000), forecastDate: '' },
      { ...chart(proxy('b', 'Rain'), 1000), forecastDate: '' },
    ])

    const list = await chartListForPath('/regions/nzsi')

    expect(list).toEqual({
      title: 'South Island',
      path: '/regions/nzsi',
      aliases: [],
      issued: 1000,
      urls: [proxy('a', 'Rain'), proxy('b', 'Rain')],
    })
  })

  test('includes the small variant of satellite charts, which phones ask for', async () => {
    vi.mocked(getSatelliteChartData).mockResolvedValue([
      chart(proxy('s1', 'Satellite'), 5),
    ])

    const list = await chartListForPath('/satellite')

    expect(list?.title).toBe('Satellite, New Zealand')
    expect(list?.urls).toEqual([
      proxy('s1', 'Satellite'),
      small('s1', 'Satellite'),
    ])
  })

  test('includes the small variant of upper air charts', async () => {
    vi.mocked(getUpperAirChartDataForCode).mockResolvedValue([
      chart(proxy('u1', 'Upper Air'), 7),
    ])

    const list = await chartListForPath('/upperair/93417')

    expect(getUpperAirChartDataForCode).toHaveBeenCalledWith('93417')
    expect(list?.title).toBe('Upper air, Paraparaumu')
    expect(list?.urls).toEqual([
      proxy('u1', 'Upper Air'),
      small('u1', 'Upper Air'),
    ])
  })

  test('an upper air page showing our chart is issued when the balloon went up', async () => {
    vi.mocked(getUpperAirChartDataForCode).mockResolvedValue([
      chart(proxy('u1', 'Upper Air'), Date.UTC(2026, 9, 12, 11)),
    ])
    vi.mocked(fetchSounding).mockResolvedValue(
      balloon(Date.UTC(2026, 9, 29, 12)),
    )

    const list = await chartListForPath('/upperair/93417')

    expect(fetchSounding).toHaveBeenCalledWith('93417')
    expect(list?.issued).toBe(Date.UTC(2026, 9, 29, 12))
    expect(list?.urls).toEqual([
      proxy('u1', 'Upper Air'),
      small('u1', 'Upper Air'),
    ])
  })

  test("an upper air page with metvuw's charts current keeps their time", async () => {
    vi.mocked(getUpperAirChartDataForCode).mockResolvedValue([
      chart(proxy('u1', 'Upper Air'), Date.UTC(2026, 9, 29, 13)),
    ])
    vi.mocked(fetchSounding).mockResolvedValue(
      balloon(Date.UTC(2026, 9, 29, 12)),
    )

    const list = await chartListForPath('/upperair/93417')

    expect(list?.issued).toBe(Date.UTC(2026, 9, 29, 13))
  })

  test('an upper air page with no balloon keeps its metvuw time', async () => {
    vi.mocked(getUpperAirChartDataForCode).mockResolvedValue([
      chart(proxy('u1', 'Upper Air'), 7),
    ])

    const list = await chartListForPath('/upperair/93417')

    expect(list?.issued).toBe(7)
  })

  test('the upper air page without a station is the default station', async () => {
    vi.mocked(getUpperAirChartDataForCode).mockResolvedValue([])

    await chartListForPath('/upperair')

    expect(getUpperAirChartDataForCode).toHaveBeenCalledWith('93112')
  })

  test('lists a radar page, whose charts have no small variant', async () => {
    vi.mocked(getRadarChartDataForCode).mockResolvedValue([
      chart(proxy('r1', 'Radar'), 9),
    ])

    const list = await chartListForPath('/radar/ch')

    expect(getRadarChartDataForCode).toHaveBeenCalledWith('ch')
    expect(list).toMatchObject({
      title: 'Radar, Christchurch',
      urls: [proxy('r1', 'Radar')],
    })
  })

  test('issued is the earliest chart, however they are ordered', async () => {
    vi.mocked(getSatelliteChartData).mockResolvedValue([
      chart(proxy('late', 'Satellite'), 30),
      chart(proxy('early', 'Satellite'), 10),
    ])

    expect((await chartListForPath('/satellite'))?.issued).toBe(10)
  })

  test('the home page is the New Zealand forecast: one page with two addresses', async () => {
    vi.mocked(getRainChartDataForRegion).mockResolvedValue([
      { ...chart(proxy('a', 'Rain'), 1000), forecastDate: '' },
    ])

    const list = await chartListForPath('/')

    expect(getRainChartDataForRegion).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'nz' }),
    )
    expect(list).toMatchObject({
      title: 'New Zealand',
      path: '/regions/nz',
      aliases: ['/'],
      urls: [proxy('a', 'Rain')],
    })
  })

  test('the New Zealand region page is the same page, and says so', async () => {
    vi.mocked(getRainChartDataForRegion).mockResolvedValue([])

    expect(await chartListForPath('/regions/nz')).toMatchObject({
      path: '/regions/nz',
      aliases: ['/'],
    })
  })

  test('the home page with a query string is still the home page', async () => {
    vi.mocked(getRainChartDataForRegion).mockResolvedValue([])

    expect(await chartListForPath('/?utm_source=x')).toMatchObject({
      path: '/regions/nz',
      aliases: ['/'],
    })
  })

  test('no other page has another address', async () => {
    vi.mocked(getSatelliteChartData).mockResolvedValue([])
    vi.mocked(getRainChartDataForRegion).mockResolvedValue([])

    expect((await chartListForPath('/satellite'))?.aliases).toEqual([])
    expect((await chartListForPath('/regions/nzsi'))?.aliases).toEqual([])
  })

  test.each([
    '/offline',
    '/regions/atlantis',
    '/radar/zz',
    '/upperair/00000',
    '/api/fallback-image',
    '//evil.example/regions/nz',
    '/regions/nz/extra',
    'regions/nz',
    '',
  ])('knows nothing about %j', async (path) => {
    expect(await chartListForPath(path)).toBeUndefined()
    expect(getRainChartDataForRegion).not.toHaveBeenCalled()
  })

  test('ignores a trailing slash, a query string and a fragment', async () => {
    vi.mocked(getRainChartDataForRegion).mockResolvedValue([])

    expect(await chartListForPath('/regions/nz/?x=1#top')).toMatchObject({
      path: '/regions/nz',
    })
  })

  test('a very long run of slashes is dealt with at once, not slowly', async () => {
    vi.mocked(getRainChartDataForRegion).mockResolvedValue([])
    const started = performance.now()

    const list = await chartListForPath(`/regions/nz${'/'.repeat(200_000)}!`)

    expect(list).toBeUndefined()
    expect(performance.now() - started).toBeLessThan(200)
  })

  test('trailing slashes of any number are ignored', async () => {
    vi.mocked(getRainChartDataForRegion).mockResolvedValue([])

    expect(await chartListForPath('/regions/nz////')).toMatchObject({
      path: '/regions/nz',
    })
  })

  test('a page with no charts has an empty list and no issue time', async () => {
    vi.mocked(getRainChartDataForRegion).mockResolvedValue([])

    expect(await chartListForPath('/regions/nz')).toMatchObject({
      issued: undefined,
      urls: [],
    })
  })
})
