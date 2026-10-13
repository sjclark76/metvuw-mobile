import NoForecast from '@/components/NoForecast'
import RegionPage from '@/components/RegionPage/region-page'
import { SatellitePage } from '@/components/SatellitePage'
import {
  getRadarChartDataForCode,
  getRainChartDataForRegion,
  getSatelliteChartData,
} from '@/shared/helpers/v2/dataSource/getWeatherChartData'

import HomePage from './page'
import RadarRoute from './radar/[code]/page'
import SatelliteRoute from './satellite/page'

vi.mock('@/shared/helpers/v2/dataSource/getWeatherChartData', () => ({
  getRainChartDataForRegion: vi.fn(),
  getRadarChartDataForCode: vi.fn(),
  getSatelliteChartData: vi.fn(),
  getUpperAirChartDataForCode: vi.fn(),
}))

const chart = { imageDateUTC: Date.UTC(2026, 9, 13), url: 'https://x/a.gif' }
const rainChart = { ...chart, forecastDate: '2026-10-13T00:00:00.000Z' }
const upstreamFailure = new Error('metvuw.com responded 502')

// A failed load must throw (so ISR keeps serving the last good page and the
// error boundary renders), never be mistaken for "no forecast".
describe('pages treat failures and empty results differently', () => {
  test('home: a loader failure propagates', async () => {
    vi.mocked(getRainChartDataForRegion).mockRejectedValue(upstreamFailure)

    await expect(HomePage()).rejects.toThrow(upstreamFailure)
  })

  test('home: an empty successful result shows NoForecast', async () => {
    vi.mocked(getRainChartDataForRegion).mockResolvedValue([])

    expect((await HomePage()).type).toBe(NoForecast)
  })

  test('home: data renders the region page', async () => {
    vi.mocked(getRainChartDataForRegion).mockResolvedValue([rainChart])

    expect((await HomePage()).type).toBe(RegionPage)
  })

  test('satellite: a loader failure propagates, empty shows NoForecast', async () => {
    vi.mocked(getSatelliteChartData).mockRejectedValue(upstreamFailure)
    await expect(SatelliteRoute()).rejects.toThrow(upstreamFailure)

    vi.mocked(getSatelliteChartData).mockResolvedValue([])
    expect((await SatelliteRoute()).type).toBe(NoForecast)

    vi.mocked(getSatelliteChartData).mockResolvedValue([chart])
    expect((await SatelliteRoute()).type).toBe(SatellitePage)
  })

  test('radar: a loader failure propagates, empty shows NoForecast', async () => {
    const props = { params: Promise.resolve({ code: 'nl' }) }

    vi.mocked(getRadarChartDataForCode).mockRejectedValue(upstreamFailure)
    await expect(RadarRoute(props)).rejects.toThrow(upstreamFailure)

    vi.mocked(getRadarChartDataForCode).mockResolvedValue([])
    expect((await RadarRoute(props)).type).toBe(NoForecast)
  })
})
