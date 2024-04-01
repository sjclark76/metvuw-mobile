import { constructRainChartData } from '@/shared/helpers/v2/chartData/constructRainChartData'

describe('constructRainChartData', () => {
  test('should construct correctly for rain', () => {
    const chartData = constructRainChartData(
      [{ name: 'rain-nzsi-thumb-2024033018-006.gif' }],
      'region/nzsi',
    )

    expect(chartData).toMatchObject([
      {
        imageDateUTC: 1711821600000,
        url: 'http://127.0.0.1:54321/storage/v1/object/public/images/region/nzsi/rain-nzsi-thumb-2024033018-006.gif',
      },
    ])
  })
})
