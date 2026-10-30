import { fetchWarnings } from '@/shared/helpers/warnings/fetchWarnings'
import type { WeatherAlert } from '@/shared/helpers/warnings/parseCapAlert'

import { GET } from './route'

vi.mock('@/shared/helpers/warnings/fetchWarnings', () => ({
  fetchWarnings: vi.fn(),
}))

const alert: WeatherAlert = {
  id: 'a',
  headline: 'Strong Wind Watch',
  event: 'wind',
  severity: 'Minor',
  colour: 'Yellow',
  colourHex: '#FFEB18',
  onsetUTC: 1,
  expiresUTC: 2,
  web: 'https://metservice.com/warnings/home',
  areas: [
    {
      description: 'Somewhere',
      polygons: [
        [
          [0, 0],
          [0, 1],
          [1, 0],
        ],
      ],
    },
  ],
}

describe('GET /api/warnings', () => {
  beforeEach(() => vi.resetAllMocks())

  test('returns the alerts, kept 5 minutes by shared caches', async () => {
    vi.mocked(fetchWarnings).mockResolvedValue([alert])

    const response = await GET()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ alerts: [alert] })
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=300, stale-while-revalidate=300',
    )
  })

  test('returns an empty list when there are no alerts', async () => {
    vi.mocked(fetchWarnings).mockResolvedValue([])

    expect(await (await GET()).json()).toEqual({ alerts: [] })
  })

  test('returns 502, briefly cached, and says so in the log, when MetService cannot be had', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(fetchWarnings).mockRejectedValue(new Error('feed answered 503'))

    const response = await GET()

    expect(response.status).toBe(502)
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=30',
    )
    expect(warn).toHaveBeenCalledWith(
      '[warnings] MetService alerts unavailable: feed answered 503',
    )
    warn.mockRestore()
  })
})
