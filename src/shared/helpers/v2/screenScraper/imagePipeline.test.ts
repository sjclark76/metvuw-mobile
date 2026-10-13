import { imagePipeline } from './imagePipeline'

const storagePaths = (_originalFileName: string, newFileName: string) => ({
  fullStoragePath: `images/rain/nz/${newFileName}`,
  smallImageStoragePath: undefined,
})

describe('imagePipeline', () => {
  test('resolves a relative scraped URL against the metvuw base URL', () => {
    const pipeline = imagePipeline(
      (relativeUrl) => relativeUrl.replace('.', 'forecast'),
      storagePaths,
    )

    const result = pipeline({ relativeUrl: './2026101318/rain-nz-006.gif' })

    expect(result.originalImageURL).toBe(
      'https://metvuw.com/forecast/2026101318/rain-nz-006.gif',
    )
    expect(result.imageFileName).toBe('rain-nz-006.webp')
  })

  // A compromised or changed metvuw page must not be able to point the
  // downloader at an arbitrary host.
  test.each([
    ['another host', 'https://evil.example/rain.gif'],
    ['a protocol-relative URL', '//evil.example/rain.gif'],
    ['plain http', 'http://metvuw.com/rain.gif'],
  ])('rejects a scraped image on %s', (_name, relativeUrl) => {
    const pipeline = imagePipeline((url) => url, storagePaths)

    expect(() => pipeline({ relativeUrl })).toThrow(/not allowed/i)
  })
})
