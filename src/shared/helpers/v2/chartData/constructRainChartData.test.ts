import { constructRainChartData } from '@/shared/helpers/v2/chartData/constructRainChartData'
import { vi } from 'vitest'

process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'

vi.mock('@/shared/db/supabase', () => {
  return {
    supabase: {
      storage: {
        from: () => ({
          getPublicUrl: (path: string) => ({
            data: {
              publicUrl: `http://localhost:54321/storage/v1/object/public/dev/${path}`,
            },
          }),
        }),
      },
    },
  }
})

describe('constructRainChartData', () => {
  test('should construct correctly for rain', () => {
    const chartData = constructRainChartData([
      {
        imageFileName: 'rain-nzsi-thumb-2024033018-006.webp',
        fullStoragePath:
          'images/region/nzsi/rain-nzsi-thumb-2024033018-006.webp',
      },
    ])

    expect(chartData).toMatchObject([
      {
        imageDateUTC: 1711821600000,
        url: 'http://localhost:54321/storage/v1/object/public/dev/images/region/nzsi/rain-nzsi-thumb-2024033018-006.webp',
      },
    ])
  })
})
