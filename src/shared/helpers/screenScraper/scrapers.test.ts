/* eslint-disable no-console -- asserts on the spied console */
import { findRegionByCode } from '@/shared/types/region'

import { loadImages } from './loadImages'
import { scrapeRadarImages } from './scrapeRadarImages'
import { scrapeRainImages } from './scrapeRainImages'
import { scrapeSatelliteImages } from './scrapeSatelliteImages'
import { scrapeUpperAirImages } from './scrapeUpperAirImages'

vi.mock('./loadImages', () => ({ loadImages: vi.fn() }))

const stubImages = (...relativeUrls: string[]) =>
  vi
    .mocked(loadImages)
    .mockResolvedValue(relativeUrls.map((relativeUrl) => ({ relativeUrl })))

describe('scrapers', () => {
  beforeEach(() => {
    vi.mocked(loadImages).mockReset()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('scrapeRainImages', () => {
    const region = findRegionByCode('nz')!

    test('builds the original url, webp name and storage path', async () => {
      stubImages('./2026101318/rain-nz-thumb-2026101318-006.gif')

      const [image] = await scrapeRainImages(region)

      expect(image).toMatchObject({
        originalImageURL:
          'https://metvuw.com/forecast/2026101318/rain-nz-thumb-2026101318-006.gif',
        imageFileName: 'rain-nz-thumb-2026101318-006.webp',
        fullStoragePath: 'images/rain/nz/rain-nz-thumb-2026101318-006.webp',
      })
    })

    test('skips and reports an image whose filename does not match', async () => {
      stubImages(
        './2026101318/rain-nz-thumb-2026101318-006.gif',
        './2026101318/rain-surprise.gif',
      )

      const images = await scrapeRainImages(region)

      expect(images).toHaveLength(1)
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('rain-surprise.gif'),
      )
    })

    test('throws when no image has a recognisable filename', async () => {
      stubImages('./rain-surprise.gif', './rain-other.gif')

      await expect(scrapeRainImages(region)).rejects.toMatchObject({
        name: 'ScrapeError',
      })
    })
  })

  describe('scrapeRadarImages', () => {
    test('derives the radar code from the filename', async () => {
      stubImages('./images/202610131500Z_nl.gif')

      const [image] = await scrapeRadarImages()

      expect(image).toMatchObject({
        originalImageURL:
          'https://metvuw.com/radar/images/202610131500Z_nl.gif',
        fullStoragePath: 'images/radar/nl/202610131500Z_nl.webp',
      })
    })

    test('skips a filename without a radar code and throws if none remain', async () => {
      stubImages('./images/202610131500Z_nl.gif', './images/banner.gif')

      expect(await scrapeRadarImages()).toHaveLength(1)

      stubImages('./images/banner.gif')
      await expect(scrapeRadarImages()).rejects.toMatchObject({
        name: 'ScrapeError',
      })
    })
  })

  describe('scrapeSatelliteImages', () => {
    test('maps the small preview to the big image', async () => {
      stubImages('./small/202610132100.jpg')

      const [image] = await scrapeSatelliteImages()

      expect(image).toMatchObject({
        originalImageURL: 'https://metvuw.com/satellite/big/202610132100.jpg',
        fullStoragePath: 'images/satellite/202610132100.webp',
      })
    })
  })

  describe('scrapeUpperAirImages', () => {
    test('derives the balloon code and drops the thumb suffix', async () => {
      stubImages('./202610112300.93112.thumb.png')

      const [image] = await scrapeUpperAirImages()

      expect(image).toMatchObject({
        originalImageURL: 'https://metvuw.com/upperair/202610112300.93112.png',
        fullStoragePath: 'images/upper-air/93112/202610112300.93112.webp',
      })
    })

    test('skips a filename without a balloon code and throws if none remain', async () => {
      stubImages('./202610112300.93112.thumb.png', './weird.thumb.png')

      expect(await scrapeUpperAirImages()).toHaveLength(1)

      stubImages('./weird.thumb.png')
      await expect(scrapeUpperAirImages()).rejects.toMatchObject({
        name: 'ScrapeError',
      })
    })
  })
})
