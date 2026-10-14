import { NextRequest } from 'next/server'

import { getCompressorForChart } from '@/shared/helpers/v2/imageCompression/getCompressorForChart'
import { downloadImageToBuffer } from '@/shared/helpers/v2/imageDownload/downloadImageToBuffer'

import { GET } from './route'

vi.mock('@/shared/helpers/v2/imageDownload/downloadImageToBuffer', () => ({
  downloadImageToBuffer: vi.fn(),
}))

vi.mock('@/shared/helpers/v2/imageCompression/getCompressorForChart', () => ({
  getCompressorForChart: vi.fn(),
}))

describe('GET /api/fallback-image', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns 400 for missing params', async () => {
    const request = new NextRequest('http://localhost:3002/api/fallback-image')
    const response = await GET(request)

    expect(response.status).toBe(400)
  })

  test('returns 403 for disallowed source host', async () => {
    const request = new NextRequest(
      'http://localhost:3002/api/fallback-image?chartType=Rain&variant=primary&url=https%3A%2F%2Fexample.com%2Fimage.gif',
    )

    const response = await GET(request)
    expect(response.status).toBe(403)
  })

  test('uses primary compressor and returns webp image', async () => {
    const sourceBuffer = Buffer.from('source')
    const transformedBuffer = Buffer.from('transformed-primary')
    const primary = vi.fn().mockResolvedValue(transformedBuffer)

    vi.mocked(downloadImageToBuffer).mockResolvedValue({
      fileBuffer: sourceBuffer,
      contentType: 'image/gif',
    })
    vi.mocked(getCompressorForChart).mockReturnValue({ primary })

    const request = new NextRequest(
      'http://localhost:3002/api/fallback-image?chartType=Rain&variant=primary&url=https%3A%2F%2Fmetvuw.com%2Fforecast%2F2026022500%2Frain-nz-thumb-2026022500-042.gif',
    )
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(primary).toHaveBeenCalledWith(sourceBuffer)
    expect(response.headers.get('Content-Type')).toBe('image/webp')
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=')

    const responseBuffer = Buffer.from(await response.arrayBuffer())
    expect(responseBuffer.equals(transformedBuffer)).toBeTruthy()
  })

  test('returns 400 when small variant is requested but unavailable', async () => {
    const sourceBuffer = Buffer.from('source')
    const primary = vi.fn().mockResolvedValue(Buffer.from('primary'))

    vi.mocked(downloadImageToBuffer).mockResolvedValue({
      fileBuffer: sourceBuffer,
      contentType: 'image/gif',
    })
    vi.mocked(getCompressorForChart).mockReturnValue({ primary })

    const request = new NextRequest(
      'http://localhost:3002/api/fallback-image?chartType=Rain&variant=small&url=https%3A%2F%2Fmetvuw.com%2Fforecast%2F2026022500%2Frain-nz-thumb-2026022500-042.gif',
    )
    const response = await GET(request)

    expect(response.status).toBe(400)
  })

  test('does not download anything when the small variant is unavailable', async () => {
    vi.mocked(getCompressorForChart).mockReturnValue({
      primary: vi.fn(),
    })

    const request = new NextRequest(
      'http://localhost:3002/api/fallback-image?chartType=Rain&variant=small&url=https%3A%2F%2Fmetvuw.com%2Fforecast%2Frain.gif',
    )
    const response = await GET(request)

    expect(response.status).toBe(400)
    expect(downloadImageToBuffer).not.toHaveBeenCalled()
  })

  test('returns 400 for an unknown chartType, variant or unparseable url', async () => {
    const base = 'http://localhost:3002/api/fallback-image'
    const goodUrl = 'url=https%3A%2F%2Fmetvuw.com%2Fforecast%2Frain.gif'

    const badChartType = await GET(
      new NextRequest(`${base}?chartType=Nope&variant=primary&${goodUrl}`),
    )
    const badVariant = await GET(
      new NextRequest(`${base}?chartType=Rain&variant=huge&${goodUrl}`),
    )
    const badUrl = await GET(
      new NextRequest(`${base}?chartType=Rain&variant=primary&url=not-a-url`),
    )

    expect([badChartType.status, badVariant.status, badUrl.status]).toEqual([
      400, 400, 400,
    ])
  })

  test.each([
    ['plain http', 'http://metvuw.com/forecast/rain.gif'],
    ['a lookalike host', 'https://metvuw.com.evil.example/rain.gif'],
    ['userinfo pointing elsewhere', 'https://metvuw.com@evil.example/rain.gif'],
    ['a non-default port', 'https://metvuw.com:8443/rain.gif'],
  ])('returns 403 and never downloads for %s', async (_name, sourceUrl) => {
    const request = new NextRequest(
      `http://localhost:3002/api/fallback-image?chartType=Rain&variant=primary&url=${encodeURIComponent(sourceUrl)}`,
    )

    const response = await GET(request)

    expect(response.status).toBe(403)
    expect(downloadImageToBuffer).not.toHaveBeenCalled()
  })

  test('returns 502 with a short cache lifetime when the upstream fails', async () => {
    const primary = vi.fn()
    vi.mocked(downloadImageToBuffer).mockRejectedValue(
      new Error('upstream responded 502'),
    )
    vi.mocked(getCompressorForChart).mockReturnValue({ primary })

    const request = new NextRequest(
      'http://localhost:3002/api/fallback-image?chartType=Rain&variant=primary&url=https%3A%2F%2Fmetvuw.com%2Fforecast%2Frain.gif',
    )
    const response = await GET(request)

    expect(response.status).toBe(502)
    expect(await response.json()).toMatchObject({ ok: false })
    expect(primary).not.toHaveBeenCalled()
    // Long enough to protect the origin during an outage, short enough to recover quickly.
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=30',
    )
  })

  test('returns 502 when the downloaded bytes cannot be processed as an image', async () => {
    vi.mocked(downloadImageToBuffer).mockResolvedValue({
      fileBuffer: Buffer.from('not an image'),
      contentType: 'image/gif',
    })
    vi.mocked(getCompressorForChart).mockReturnValue({
      primary: vi
        .fn()
        .mockRejectedValue(
          new Error('Input buffer contains unsupported image format'),
        ),
    })

    const request = new NextRequest(
      'http://localhost:3002/api/fallback-image?chartType=Rain&variant=primary&url=https%3A%2F%2Fmetvuw.com%2Fforecast%2Frain.gif',
    )
    const response = await GET(request)

    expect(response.status).toBe(502)
  })

  test('uses small compressor when small variant is requested', async () => {
    const sourceBuffer = Buffer.from('source')
    const primary = vi.fn().mockResolvedValue(Buffer.from('primary'))
    const small = vi.fn().mockResolvedValue(Buffer.from('small'))

    vi.mocked(downloadImageToBuffer).mockResolvedValue({
      fileBuffer: sourceBuffer,
      contentType: 'image/gif',
    })
    vi.mocked(getCompressorForChart).mockReturnValue({ primary, small })

    const request = new NextRequest(
      'http://localhost:3002/api/fallback-image?chartType=Satellite&variant=small&url=https%3A%2F%2Fmetvuw.com%2Fsatellite%2Fbig%2F2026022500.jpg',
    )
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(small).toHaveBeenCalledWith(sourceBuffer)
  })
})
