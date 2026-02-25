import { NextRequest } from 'next/server'

import { getCompressorForChart } from '@/shared/helpers/v2/imageCompression/getCompressorForChart'
import { downloadImageToBuffer } from '@/shared/helpers/v2/imageStorage/downloadImageToBuffer'

import { GET } from './route'

vi.mock('@/shared/helpers/v2/imageStorage/downloadImageToBuffer', () => ({
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
