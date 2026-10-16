import { downloadImageToBuffer } from './downloadImageToBuffer'

const URL_OK = 'https://metvuw.com/forecast/2026101318/rain-nz-006.gif'

function imageResponse(
  body = 'image-bytes',
  init: NonNullable<ConstructorParameters<typeof Response>[1]> = {},
) {
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'image/gif' },
    ...init,
  })
}

function redirect(location: string, status = 302) {
  return new Response(null, { status, headers: { location } })
}

describe('downloadImageToBuffer', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  test('returns the body and content type of an image response', async () => {
    fetchMock.mockResolvedValue(imageResponse('abc'))

    const result = await downloadImageToBuffer(URL_OK)

    expect(result.fileBuffer.toString()).toBe('abc')
    expect(result.contentType).toBe('image/gif')
  })

  test('never lets fetch follow redirects, and bounds the request in time', async () => {
    fetchMock.mockResolvedValue(imageResponse())

    await downloadImageToBuffer(URL_OK)

    const init = fetchMock.mock.calls[0][1]
    expect(init.redirect).toBe('manual')
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  test('rejects a non-2xx response instead of treating the body as an image', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>Bad Gateway</html>', {
        status: 502,
        headers: { 'content-type': 'text/html' },
      }),
    )

    await expect(downloadImageToBuffer(URL_OK)).rejects.toMatchObject({
      name: 'UpstreamImageError',
      status: 502,
    })
  })

  test('rejects a 200 response that is not an image', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>Oops</html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    )

    await expect(downloadImageToBuffer(URL_OK)).rejects.toThrow(/not an image/i)
  })

  test('rejects a response that declares a body over the size cap', async () => {
    fetchMock.mockResolvedValue(
      imageResponse('x', {
        headers: { 'content-type': 'image/gif', 'content-length': '999999' },
      }),
    )

    await expect(
      downloadImageToBuffer(URL_OK, { maxBytes: 1000 }),
    ).rejects.toThrow(/too large/i)
  })

  test('enforces the size cap while streaming, even without a content-length', async () => {
    fetchMock.mockResolvedValue(imageResponse('x'.repeat(5000)))

    await expect(
      downloadImageToBuffer(URL_OK, { maxBytes: 1000 }),
    ).rejects.toThrow(/too large/i)
  })

  test('follows a redirect to another allowed URL', async () => {
    fetchMock
      .mockResolvedValueOnce(redirect('/forecast/moved/rain.gif', 301))
      .mockResolvedValueOnce(imageResponse('moved'))

    const result = await downloadImageToBuffer(URL_OK)

    expect(result.fileBuffer.toString()).toBe('moved')
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://metvuw.com/forecast/moved/rain.gif',
    )
  })

  test.each([
    ['another host', 'https://evil.example/rain.gif'],
    ['plain http', 'http://metvuw.com/rain.gif'],
    ['credentials', 'https://user:pw@metvuw.com/rain.gif'],
  ])('refuses a redirect to %s without requesting it', async (_n, target) => {
    fetchMock.mockResolvedValueOnce(redirect(target))

    await expect(downloadImageToBuffer(URL_OK)).rejects.toThrow(/redirect/i)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('gives up after too many redirects', async () => {
    fetchMock.mockImplementation(async () => redirect('/loop.gif'))

    await expect(downloadImageToBuffer(URL_OK)).rejects.toThrow(/redirect/i)
    // the original request plus the three redirects it is allowed to follow
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  test('refuses a URL that is not allowed without calling fetch', async () => {
    await expect(
      downloadImageToBuffer('https://evil.example/rain.gif'),
    ).rejects.toThrow(/not allowed/i)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('wraps network failures', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))

    await expect(downloadImageToBuffer(URL_OK)).rejects.toMatchObject({
      name: 'UpstreamImageError',
    })
  })

  test('wraps a timeout', async () => {
    fetchMock.mockRejectedValue(
      Object.assign(new Error('timed out'), { name: 'TimeoutError' }),
    )

    await expect(downloadImageToBuffer(URL_OK)).rejects.toThrow(/timed out/i)
  })
})
