import { loadImages } from './loadImages'

const page = (body: string) =>
  new Response(`<html><body>${body}</body></html>`, {
    status: 200,
    headers: { 'content-type': 'text/html' },
  })

describe('loadImages', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('returns the src of every image matching the selector', async () => {
    fetchMock.mockResolvedValue(
      page(`
        <img src="../pageheaders/banner.png">
        <IMG SRC="./2026101318/rain-nz-thumb-2026101318-006.gif" width="220">
        <img src="./2026101318/rain-nz-thumb-2026101318-012.gif">
      `),
    )

    const images = await loadImages('forecast/forecast.php', 'img[src*=rain]')

    expect(images).toEqual([
      { relativeUrl: './2026101318/rain-nz-thumb-2026101318-006.gif' },
      { relativeUrl: './2026101318/rain-nz-thumb-2026101318-012.gif' },
    ])
  })

  test('resolves the page against the metvuw base url and bounds the request in time', async () => {
    fetchMock.mockResolvedValue(page('<img src="./a-rain.gif">'))

    await loadImages('forecast/forecast.php?type=rain', 'img[src*=rain]')

    const [target, init] = fetchMock.mock.calls[0]
    expect(target).toBe('https://metvuw.com/forecast/forecast.php?type=rain')
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  // A 502 error page parses as HTML with no matching images; it must not be
  // mistaken for "metvuw has no charts".
  test('throws when the page responds with a non-2xx status', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>Bad Gateway</html>', { status: 502 }),
    )

    await expect(
      loadImages('forecast', 'img[src*=rain]'),
    ).rejects.toMatchObject({
      name: 'ScrapeError',
      message: expect.stringContaining('502'),
    })
  })

  test('throws when the request fails or times out', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))

    await expect(
      loadImages('forecast', 'img[src*=rain]'),
    ).rejects.toMatchObject({
      name: 'ScrapeError',
      message: expect.stringContaining('fetch failed'),
    })
  })

  test('throws when no image matches, because the page structure has changed', async () => {
    fetchMock.mockResolvedValue(page('<p>We have redesigned our site</p>'))

    await expect(
      loadImages('forecast', 'img[src*=rain]'),
    ).rejects.toMatchObject({
      name: 'ScrapeError',
      message: expect.stringContaining('no images'),
    })
  })

  test('ignores matching images that have no src', async () => {
    fetchMock.mockResolvedValue(
      page('<img data-x="rain"><img src="./rain-ok.gif">'),
    )

    const images = await loadImages('forecast', 'img[data-x],img[src*=rain]')

    expect(images).toEqual([{ relativeUrl: './rain-ok.gif' }])
  })
})
