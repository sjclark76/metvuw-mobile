import { constructChartDataFromScrapedImages } from '@/shared/helpers/v2/chartData/constructChartDataFromScrapedImages'

describe('constructChartDataFromScrapedImages', () => {
  test('maps scraped image URLs and extracts utc date from filename', () => {
    const chartData = constructChartDataFromScrapedImages([
      {
        imageFileName: '202403292100Z_ak.webp',
        fullStoragePath: 'images/radar/ak/202403292100Z_ak.webp',
        originalFileName: '202403292100Z_ak.gif',
        originalImageURL: 'https://metvuw.com/radar/images/202403292100Z_ak.gif',
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
