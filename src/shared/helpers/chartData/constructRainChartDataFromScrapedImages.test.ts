/* eslint-disable no-console -- asserts on the spied console */
import { constructRainChartDataFromScrapedImages } from '@/shared/helpers/chartData/constructRainChartDataFromScrapedImages'

describe('constructRainChartDataFromScrapedImages', () => {
  test('maps direct source urls and calculates forecast date from offset', () => {
    const chartData = constructRainChartDataFromScrapedImages([
      {
        imageFileName: 'rain-nzsi-thumb-2024033018-006.webp',
        fullStoragePath: 'images/rain/nzsi/rain-nzsi-thumb-2024033018-006.webp',
        originalFileName: 'rain-nzsi-thumb-2024033018-006.gif',
        originalImageURL:
          'https://metvuw.com/forecast/2024033018/rain-nzsi-thumb-2024033018-006.gif',
      },
    ])

    expect(chartData).toMatchObject([
      {
        imageDateUTC: 1711821600000,
        forecastDate: '2024-03-31T00:00:00.000Z',
        url: 'https://metvuw.com/forecast/2024033018/rain-nzsi-thumb-2024033018-006.gif',
      },
    ])
  })
})

describe('constructRainChartDataFromScrapedImages with bad filenames', () => {
  const scraped = (imageFileName: string) => ({
    imageFileName,
    fullStoragePath: `images/rain/nz/${imageFileName}`,
    originalFileName: imageFileName.replace('.webp', '.gif'),
    originalImageURL: `https://metvuw.com/forecast/x/${imageFileName}`,
  })

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Previously an unparseable name fell back to year 0 and was shown as a real
  // 1900-era forecast.
  test('drops an unparseable filename instead of inventing a date', () => {
    const chartData = constructRainChartDataFromScrapedImages([
      scraped('rain-nz-thumb-2026101318-006.webp'),
      scraped('rain-surprise.webp'),
    ])

    expect(chartData).toHaveLength(1)
    expect(chartData[0].imageDateUTC).toBe(Date.UTC(2026, 9, 13, 18))
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('rain-surprise.webp'),
    )
  })

  test('drops a filename with an impossible date', () => {
    const chartData = constructRainChartDataFromScrapedImages([
      scraped('rain-nz-thumb-2026101318-006.webp'),
      scraped('rain-nz-thumb-2026139918-006.webp'),
    ])

    expect(chartData).toHaveLength(1)
  })

  test('throws when images were scraped but none can be parsed', () => {
    expect(() =>
      constructRainChartDataFromScrapedImages([scraped('rain-surprise.webp')]),
    ).toThrow(expect.objectContaining({ name: 'ScrapeError' }))
  })

  test('returns an empty list for an empty input', () => {
    expect(constructRainChartDataFromScrapedImages([])).toEqual([])
  })

  test('rolls the forecast date over month and year boundaries', () => {
    const [chart] = constructRainChartDataFromScrapedImages([
      scraped('rain-nz-thumb-2026123118-012.webp'),
    ])

    expect(chart.forecastDate).toBe('2027-01-01T06:00:00.000Z')
  })
})
