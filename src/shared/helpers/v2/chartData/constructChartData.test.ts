import { constructChartData } from '@/shared/helpers/v2/chartData/constructChartData'

describe('constructChartData', () => {
  test('should construct correctly for satellite', () => {
    const chartData = constructChartData([
      {
        storagePath: '202403291200.jpg',
        fullStoragePath: 'satellite/202403291200.jpg',
      },
    ])

    expect(chartData).toMatchObject([
      {
        imageDateUTC: 1711713600000,
        url: 'http://127.0.0.1:54321/storage/v1/object/public/images/satellite/202403291200.jpg',
      },
    ])
  })

  test('should construct correctly for radar', () => {
    const chartData = constructChartData([
      {
        storagePath: '202403292100Z_ak.gif',
        fullStoragePath: 'radar/ak/202403292100Z_ak.gif',
      },
    ])

    expect(chartData).toMatchObject([
      {
        imageDateUTC: 1711746000000,
        url: 'http://127.0.0.1:54321/storage/v1/object/public/images/radar/ak/202403292100Z_ak.gif',
      },
    ])
  })

  test('should construct correctly for upper-air', () => {
    const chartData = constructChartData([
      {
        storagePath: '202403201200.93112.webp',
        fullStoragePath: 'upper-air/93112/202403201200.93112.webp',
      },
    ])

    expect(chartData).toMatchObject([
      {
        imageDateUTC: 1710936000000,
        url: 'http://127.0.0.1:54321/storage/v1/object/public/images/upper-air/93112/202403201200.93112.webp',
      },
    ])

    expect(
      new Date(chartData[0].imageDateUTC).toISOString(),
    ).toMatchInlineSnapshot(`"2024-03-20T12:00:00.000Z"`)
  })

  test('upper air scenario 1 creates the correct date', () => {
    const storageImage = {
      storagePath: '202403201200.93112.webp',
      fullStoragePath: 'upper-air/93112/202403201200.93112.webp',
    }
    const result = constructChartData([storageImage])

    expect(result).toHaveLength(1)
    expect(new Date(result[0].imageDateUTC).toISOString()).toBe(
      '2024-03-20T12:00:00.000Z',
    )
  })

  test('upper air scenario 1 creates the correct date', () => {
    const storageImage = {
      storagePath: '202403210000.93112.webp',
      fullStoragePath: 'upper-air/93112/202403210000.93112.webp',
    }
    const result = constructChartData([storageImage])

    expect(result).toHaveLength(1)
    expect(new Date(result[0].imageDateUTC).toISOString()).toBe(
      '2024-03-21T00:00:00.000Z',
    )
  })
})
