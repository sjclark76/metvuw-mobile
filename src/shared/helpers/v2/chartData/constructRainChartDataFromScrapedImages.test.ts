import { constructRainChartDataFromScrapedImages } from '@/shared/helpers/v2/chartData/constructRainChartDataFromScrapedImages'

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
