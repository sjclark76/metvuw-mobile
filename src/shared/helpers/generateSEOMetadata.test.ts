import { config } from '@/config'

import generateSEOMetadata from './generateSEOMetadata'

const input = {
  title: 'metvuw mobile | nz',
  description: 'Forecast charts',
  url: 'regions/nz',
}

describe('generateSEOMetadata', () => {
  test('uses the title and description for the page and for sharing', () => {
    const metadata = generateSEOMetadata(input)

    expect(metadata.title).toBe(input.title)
    expect(metadata.description).toBe(input.description)
    expect(metadata.openGraph).toMatchObject({
      title: input.title,
      description: input.description,
      url: input.url,
      siteName: 'Metvuw Mobile',
      type: 'website',
    })
  })

  test('makes the url the canonical address', () => {
    expect(generateSEOMetadata(input).alternates).toEqual({
      canonical: input.url,
    })
  })

  test('resolves relative urls against the site origin', () => {
    expect(generateSEOMetadata(input).metadataBase).toEqual(
      new URL(config.baseUrl),
    )
  })

  test('links the manifest', () => {
    expect(generateSEOMetadata(input).manifest).toBe('/manifest.json')
  })

  test('lists the favicon and apple touch icons, each pointing at a real file', () => {
    const icons = generateSEOMetadata(input).icons as {
      rel: string
      url: string
    }[]

    expect(
      icons.filter((i) => i.rel === 'apple-touch-icon').length,
    ).toBeGreaterThan(5)
    expect(icons.filter((i) => i.rel === 'icon').length).toBeGreaterThan(2)
    for (const { url } of icons) {
      expect(url).toMatch(/^\/[\w-]+\.png$/)
    }
  })
})
