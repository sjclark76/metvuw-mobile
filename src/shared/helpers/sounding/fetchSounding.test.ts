import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { fetchSounding, latestLaunchUTC, soundingUrl } from './fetchSounding'

const page = readFileSync(
  join(__dirname, 'fixtures', 'invercargill-2026102912.html'),
  'utf8',
)
const NOW = new Date('2026-10-30T05:00:00Z')
const fetchMock = vi.fn()

const datetimeOf = (call: unknown[]) =>
  new URL(String(call[0])).searchParams.get('datetime')

describe('latestLaunchUTC', () => {
  test('is the last 00 or 12 UTC at or before now', () => {
    expect(latestLaunchUTC(NOW)).toBe(Date.UTC(2026, 9, 30, 0))
    expect(latestLaunchUTC(new Date('2026-10-30T12:00:00Z'))).toBe(
      Date.UTC(2026, 9, 30, 12),
    )
  })
})

describe('soundingUrl', () => {
  test('asks Wyoming for the station at the launch time, as text', () => {
    expect(soundingUrl('93844', Date.UTC(2026, 9, 29, 12))).toBe(
      'https://weather.uwyo.edu/wsgi/sounding?datetime=2026-10-29+12%3A00%3A00&id=93844&src=UNKNOWN&type=TEXT%3ALIST',
    )
  })
})

describe('fetchSounding', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  test('returns the latest launch when it has data', async () => {
    fetchMock.mockResolvedValue(new Response(page))

    const fetched = await fetchSounding('93844', NOW)

    expect(fetched?.launchUTC).toBe(Date.UTC(2026, 9, 30, 0))
    expect(fetched?.sounding.levels).toHaveLength(3777)
    expect(fetched?.sourceUrl).toBe(String(fetchMock.mock.calls[0][0]))
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      next: { revalidate: 3600 },
    })
  })

  test('steps back a launch at a time past ones with no data', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response('Unable to retrieve the data', { status: 400 }),
      )
      .mockResolvedValueOnce(new Response('<html>no table</html>'))
      .mockResolvedValueOnce(new Response(page))

    const fetched = await fetchSounding('93844', NOW)

    expect(fetchMock.mock.calls.map(datetimeOf)).toEqual([
      '2026-10-30 00:00:00',
      '2026-10-29 12:00:00',
      '2026-10-29 00:00:00',
    ])
    expect(fetched?.launchUTC).toBe(Date.UTC(2026, 9, 29, 0))
  })

  test('gives up after four launches', async () => {
    fetchMock.mockImplementation(
      async () => new Response('Unable to retrieve the data', { status: 400 }),
    )

    expect(await fetchSounding('93844', NOW)).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  test('stops at once when Wyoming is too busy, without asking again', async () => {
    fetchMock.mockResolvedValue(
      new Response('The server is too busy, try again later.', {
        status: 503,
      }),
    )

    expect(await fetchSounding('93844', NOW)).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('stops when the request fails or times out', async () => {
    fetchMock.mockRejectedValue(new DOMException('timed out', 'TimeoutError'))

    expect(await fetchSounding('93844', NOW)).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
