import { constructChartData } from '@/shared/helpers/v2/chartData/constructChartData'

describe('constructChartData', () => {
  test('should construct correctly for satellite', () => {
    const chartData = constructChartData(
      [{ name: '202403291200.jpg' }],
      'satellite',
    )

    expect(chartData).toMatchObject([
      {
        imageDateUTC: 1711713600000,
        url: 'http://127.0.0.1:54321/storage/v1/object/public/images/satellite/202403291200.jpg',
      },
    ])
  })

  test('should construct correctly for radar', () => {
    const chartData = constructChartData(
      [{ name: '202403292100Z_ak.gif' }],
      'radar/ak',
    )

    expect(chartData).toMatchObject([
      {
        imageDateUTC: 1711746000000,
        url: 'http://127.0.0.1:54321/storage/v1/object/public/images/radar/ak/202403292100Z_ak.gif',
      },
    ])
  })

  test('should construct correctly for upper-air', () => {
    const chartData = constructChartData(
      [{ name: '202403201200.93112.png' }],
      'upper-air/93112',
    )

    expect(chartData).toMatchObject([
      {
        imageDateUTC: 1710936000000,
        url: 'http://127.0.0.1:54321/storage/v1/object/public/images/upper-air/93112/202403201200.93112.png',
      },
    ])
  })
})
