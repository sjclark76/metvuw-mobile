import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { fetchWarnings } from './fetchWarnings'

const fixture = (name: string) =>
  readFileSync(join(__dirname, 'fixtures', name), 'utf8')
const atom = fixture('atom.xml')
const NOW = new Date('2026-10-30T00:00:00Z')
const WIND_ID = '2.49.0.0.554.0.severeweather.nz.20261029205033134.1'
const SNOW_ID = '2.49.0.0.554.0.roadsnow.lewispass.20261029212818927.0'
// The feed lists four alerts: two of them are here, the others answer 404.
const alertsById: Record<string, string> = {
  [WIND_ID]: fixture('wind-hawkes-bay.xml'),
  [SNOW_ID]: fixture('road-snow-lewis-pass.xml'),
}
const fetchMock = vi.fn()

const serve = (feed: () => Response = () => new Response(atom)) =>
  fetchMock.mockImplementation(async (url: string) => {
    const address = new URL(String(url))
    if (address.pathname === '/cap/atom') return feed()
    const body = alertsById[address.searchParams.get('id') ?? '']
    return body ? new Response(body) : new Response('no', { status: 404 })
  })

describe('fetchWarnings', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    serve()
  })
  afterEach(() => vi.unstubAllGlobals())

  test('reads the feed, then each alert it lists', async () => {
    const alerts = await fetchWarnings(NOW)

    expect(alerts.map((alert) => alert.id)).toEqual([WIND_ID, SNOW_ID])
    expect(fetchMock).toHaveBeenCalledTimes(5)
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://alerts.metservice.com/cap/atom',
    )
  })

  test('keeps each answer for 5 minutes, and gives up together after 8 s', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout')

    await fetchWarnings(NOW)

    expect(timeout).toHaveBeenCalledTimes(1)
    expect(timeout).toHaveBeenCalledWith(8_000)
    const signal = fetchMock.mock.calls[0][1].signal
    for (const [, options] of fetchMock.mock.calls) {
      expect(options.next).toEqual({ revalidate: 300 })
      expect(options.signal).toBe(signal)
    }
    timeout.mockRestore()
  })

  test('skips an alert that cannot be had, and keeps the rest', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      const address = new URL(String(url))
      if (address.pathname === '/cap/atom') return new Response(atom)
      if (address.searchParams.get('id') === WIND_ID) throw new Error('reset')
      return new Response(
        alertsById[address.searchParams.get('id') ?? ''] ?? '',
        {
          status: alertsById[address.searchParams.get('id') ?? ''] ? 200 : 404,
        },
      )
    })

    const alerts = await fetchWarnings(NOW)

    expect(alerts.map((alert) => alert.id)).toEqual([SNOW_ID])
  })

  test('fails when the feed cannot be had', async () => {
    serve(() => new Response('busy', { status: 503 }))

    await expect(fetchWarnings(NOW)).rejects.toThrow('503')
  })

  test('does not follow a link to anywhere but MetService', async () => {
    serve(
      () =>
        new Response(
          atom.replaceAll(
            'https://alerts.metservice.com/cap/alert',
            'https://evil.example/cap/alert',
          ),
        ),
    )

    expect(await fetchWarnings(NOW)).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
