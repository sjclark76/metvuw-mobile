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
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    serve()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    warn.mockRestore()
  })

  test('reads the feed, then each alert it lists', async () => {
    const alerts = await fetchWarnings(NOW)

    expect(alerts.map((alert) => alert.id)).toEqual([WIND_ID, SNOW_ID])
    expect(fetchMock).toHaveBeenCalledTimes(5)
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://alerts.metservice.com/cap/atom',
    )
  })

  test('keeps the feed 5 minutes and each alert an hour, and gives up together after 8 s', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout')

    await fetchWarnings(NOW)

    expect(timeout).toHaveBeenCalledTimes(1)
    expect(timeout).toHaveBeenCalledWith(8_000)
    const signal = fetchMock.mock.calls[0][1].signal
    fetchMock.mock.calls.forEach(([, options], index) => {
      expect(options.next).toEqual({ revalidate: index === 0 ? 300 : 3600 })
      expect(options.signal).toBe(signal)
    })
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

    await expect(fetchWarnings(NOW)).rejects.toThrow(
      '4 feed entries but no alert links',
    )
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('fails when the feed is not an Atom feed', async () => {
    serve(() => new Response('<html><body>maintenance</body></html>'))

    await expect(fetchWarnings(NOW)).rejects.toThrow('not an Atom feed')
  })

  test('follows the good links and logs the one it ignores', async () => {
    serve(
      () =>
        new Response(
          atom.replace(
            `https://alerts.metservice.com/cap/alert?id=${WIND_ID}`,
            `https://evil.example/cap/alert?id=${WIND_ID}`,
          ),
        ),
    )

    const alerts = await fetchWarnings(NOW)

    expect(alerts.map((alert) => alert.id)).toEqual([SNOW_ID])
    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/^\[warnings\] feed link ignored: https:\/\/evil/),
    )
    expect(
      warn.mock.calls.filter(([m]: [string]) => /feed link ignored/.test(m)),
    ).toHaveLength(1)
  })

  test('an alert that is not a CAP alert counts as failed', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      const address = new URL(String(url))
      if (address.pathname === '/cap/atom') return new Response(atom)
      if (address.searchParams.get('id') === WIND_ID)
        return new Response('<html>maintenance</html>')
      return new Response(alertsById[address.searchParams.get('id') ?? ''])
    })

    const alerts = await fetchWarnings(NOW)

    expect(alerts.map((alert) => alert.id)).toEqual([SNOW_ID])
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/skipped: not a CAP alert$/),
    )
  })

  test('throws when every alert is not a CAP alert', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      const address = new URL(String(url))
      if (address.pathname === '/cap/atom') return new Response(atom)
      return new Response('<html>maintenance</html>')
    })

    await expect(fetchWarnings(NOW)).rejects.toThrow('all 4 alerts failed')
  })

  test('logs each alert it skips, with why', async () => {
    const alerts = await fetchWarnings(NOW)

    expect(alerts.map((alert) => alert.id)).toEqual([WIND_ID, SNOW_ID])
    expect(warn).toHaveBeenCalledTimes(2)
    for (const [message] of warn.mock.calls) {
      expect(message).toMatch(
        /^\[warnings\] alert https:\/\/alerts\.metservice\.com\/cap\/alert\?id=/,
      )
      expect(message).toMatch(/skipped: answered 404$/)
    }
  })

  test('logs the error name and message when an alert request fails', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      const address = new URL(String(url))
      if (address.pathname === '/cap/atom') return new Response(atom)
      if (address.searchParams.get('id') === WIND_ID)
        throw Object.assign(new Error('x'), { name: 'TimeoutError' })
      return new Response(alertsById[address.searchParams.get('id') ?? ''])
    })

    expect((await fetchWarnings(NOW)).map((alert) => alert.id)).toEqual([
      SNOW_ID,
    ])
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/skipped: TimeoutError: x$/),
    )
  })

  test('throws when every alert fails, so the route says the warnings are unavailable', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      const address = new URL(String(url))
      if (address.pathname === '/cap/atom') return new Response(atom)
      return new Response('busy', { status: 503 })
    })

    await expect(fetchWarnings(NOW)).rejects.toThrow('all 4 alerts failed')
    expect(warn).toHaveBeenCalledTimes(4)
  })

  test('an empty feed is not a failure', async () => {
    serve(
      () => new Response('<feed xmlns="http://www.w3.org/2005/Atom"></feed>'),
    )

    expect(await fetchWarnings(NOW)).toEqual([])
    expect(warn).not.toHaveBeenCalled()
  })

  test('an alert that loads but has ended is not a failure', async () => {
    const after = new Date('2026-10-30T09:00:00Z')

    expect(await fetchWarnings(after)).toEqual([])
    // Only the two 404s: the loaded alerts have ended, so they are not failures.
    expect(warn).toHaveBeenCalledTimes(2)
  })
})
