/* eslint-disable no-console -- asserts on the spied console */
import { constructChartDataFromScrapedImages } from '@/shared/helpers/chartData/constructChartDataFromScrapedImages'

describe('constructChartDataFromScrapedImages', () => {
  test('maps scraped image URLs and extracts utc date from filename', () => {
    const chartData = constructChartDataFromScrapedImages([
      {
        imageFileName: '202403292100Z_ak.webp',
        fullStoragePath: 'images/radar/ak/202403292100Z_ak.webp',
        originalFileName: '202403292100Z_ak.gif',
        originalImageURL:
          'https://metvuw.com/radar/images/202403292100Z_ak.gif',
      },
    ])

    expect(chartData).toMatchObject([
      {
        imageDateUTC: 1711746000000,
        url: 'https://metvuw.com/radar/images/202403292100Z_ak.gif',
      },
    ])
  })
})

describe('constructChartDataFromScrapedImages with bad filenames', () => {
  const scraped = (imageFileName: string) => ({
    imageFileName,
    fullStoragePath: `images/satellite/${imageFileName}`,
    originalFileName: imageFileName,
    originalImageURL: `https://metvuw.com/satellite/big/${imageFileName}`,
  })

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('parses the date from the leading digits of the filename', () => {
    const [chart] = constructChartDataFromScrapedImages([
      scraped('202610132100.webp'),
    ])

    expect(chart.imageDateUTC).toBe(Date.UTC(2026, 9, 13, 21))
  })

  test('drops a filename without a date instead of producing NaN', () => {
    const chartData = constructChartDataFromScrapedImages([
      scraped('202610132100.webp'),
      scraped('banner.webp'),
    ])

    expect(chartData).toHaveLength(1)
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('banner.webp'),
    )
  })

  test('drops a filename with an impossible date', () => {
    const chartData = constructChartDataFromScrapedImages([
      scraped('202610132100.webp'),
      scraped('202613992500.webp'),
    ])

    expect(chartData).toHaveLength(1)
  })

  test('throws when images were scraped but none can be parsed', () => {
    expect(() =>
      constructChartDataFromScrapedImages([scraped('banner.webp')]),
    ).toThrow(expect.objectContaining({ name: 'ScrapeError' }))
  })

  test('returns an empty list for an empty input', () => {
    expect(constructChartDataFromScrapedImages([])).toEqual([])
  })
})
