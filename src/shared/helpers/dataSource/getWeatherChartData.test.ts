import {
  getRadarChartDataForCode,
  getRainChartDataForRegion,
  getSatelliteChartData,
  getUpperAirChartDataForCode,
} from '@/shared/helpers/dataSource/getWeatherChartData'
import {
  scrapeRadarImages,
  scrapeRainImages,
  scrapeSatelliteImages,
  scrapeUpperAirImages,
} from '@/shared/helpers/screenScraper'
import { findRegionByCode } from '@/shared/types/region'

vi.mock('@/shared/helpers/screenScraper', () => ({
  scrapeRadarImages: vi.fn(),
  scrapeRainImages: vi.fn(),
  scrapeSatelliteImages: vi.fn(),
  scrapeUpperAirImages: vi.fn(),
}))

describe('getWeatherChartData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('rain provider uses scraper and returns sorted proxy chart urls', async () => {
    const region = findRegionByCode('nz')
    if (!region) {
      throw new Error('expected nz region')
    }

    vi.mocked(scrapeRainImages).mockResolvedValue([
      {
        imageFileName: 'rain-nz-thumb-2024033018-006.webp',
        fullStoragePath: 'images/rain/nz/rain-nz-thumb-2024033018-006.webp',
        originalFileName: 'rain-nz-thumb-2024033018-006.gif',
        originalImageURL:
          'https://metvuw.com/forecast/2024033018/rain-nz-thumb-2024033018-006.gif',
      },
      {
        imageFileName: 'rain-nz-thumb-2024033012-006.webp',
        fullStoragePath: 'images/rain/nz/rain-nz-thumb-2024033012-006.webp',
        originalFileName: 'rain-nz-thumb-2024033012-006.gif',
        originalImageURL:
          'https://metvuw.com/forecast/2024033012/rain-nz-thumb-2024033012-006.gif',
      },
    ])

    const result = await getRainChartDataForRegion(region)

    expect(result).toHaveLength(2)
    expect(result[0].url).toContain('/api/fallback-image?')
    expect(result[0].url).toContain('chartType=Rain')
    expect(result[0].url).toContain('variant=primary')
    expect(decodeURIComponent(result[0].url)).toContain(
      'rain-nz-thumb-2024033012-006.gif',
    )
    expect(decodeURIComponent(result[1].url)).toContain(
      'rain-nz-thumb-2024033018-006.gif',
    )
  })

  test('radar provider filters by code', async () => {
    vi.mocked(scrapeRadarImages).mockResolvedValue([
      {
        imageFileName: '202403292100Z_ak.webp',
        fullStoragePath: 'images/radar/ak/202403292100Z_ak.webp',
        originalFileName: '202403292100Z_ak.gif',
        originalImageURL:
          'https://metvuw.com/radar/images/202403292100Z_ak.gif',
      },
      {
        imageFileName: '202403292100Z_nl.webp',
        fullStoragePath: 'images/radar/nl/202403292100Z_nl.webp',
        originalFileName: '202403292100Z_nl.gif',
        originalImageURL:
          'https://metvuw.com/radar/images/202403292100Z_nl.gif',
      },
    ])

    const result = await getRadarChartDataForCode('ak')

    expect(result).toHaveLength(1)
    expect(result[0].url).toContain('/api/fallback-image?')
    expect(result[0].url).toContain('chartType=Radar')
    expect(decodeURIComponent(result[0].url)).toContain('_ak.gif')
  })

  test('satellite provider returns proxy urls', async () => {
    vi.mocked(scrapeSatelliteImages).mockResolvedValue([
      {
        imageFileName: '202403291200.webp',
        fullStoragePath: 'images/satellite/202403291200.webp',
        originalFileName: '202403291200.jpg',
        originalImageURL: 'https://metvuw.com/satellite/big/202403291200.jpg',
      },
    ])

    const result = await getSatelliteChartData()

    expect(result).toHaveLength(1)
    expect(result[0].url).toContain('/api/fallback-image?')
    expect(result[0].url).toContain('chartType=Satellite')
    expect(decodeURIComponent(result[0].url)).toContain(
      'metvuw.com/satellite/big',
    )
  })

  test('upper-air provider filters by balloon code', async () => {
    vi.mocked(scrapeUpperAirImages).mockResolvedValue([
      {
        imageFileName: '202403201200.93112.webp',
        fullStoragePath: 'images/upper-air/93112/202403201200.93112.webp',
        originalFileName: '202403201200.93112.png',
        originalImageURL: 'https://metvuw.com/upperair/202403201200.93112.png',
      },
      {
        imageFileName: '202403201200.93417.webp',
        fullStoragePath: 'images/upper-air/93417/202403201200.93417.webp',
        originalFileName: '202403201200.93417.png',
        originalImageURL: 'https://metvuw.com/upperair/202403201200.93417.png',
      },
    ])

    const result = await getUpperAirChartDataForCode('93112')

    expect(result).toHaveLength(1)
    expect(result[0].url).toContain('/api/fallback-image?')
    expect(result[0].url).toContain('chartType=Upper+Air')
    expect(decodeURIComponent(result[0].url)).toContain('93112')
  })
})
