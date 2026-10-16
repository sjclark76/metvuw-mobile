import { IMAGE_CACHE_CONTROL, UPSTREAM_ERROR_CACHE_CONTROL } from './imageCache'

const seconds = (header: string, directive: string) =>
  Number(header.match(new RegExp(`${directive}=(\\d+)`))?.[1])

const DAY = 24 * 60 * 60

describe('image cache policy', () => {
  // A chart URL names its model run and forecast hour (or its timestamp), and
  // metvuw publishes each file once, so the processed image never changes.
  describe('for a processed chart image', () => {
    test('is public, so the CDN may store it', () => {
      expect(IMAGE_CACHE_CONTROL).toMatch(/^public,/)
    })

    test('lets the CDN keep it for at least a day', () => {
      expect(seconds(IMAGE_CACHE_CONTROL, 's-maxage')).toBeGreaterThanOrEqual(
        DAY,
      )
    })

    test('lets the browser keep it for a day', () => {
      expect(seconds(IMAGE_CACHE_CONTROL, 'max-age')).toBe(DAY)
    })

    test('keeps the browser lifetime shorter than the CDN lifetime, so a bad image can be corrected', () => {
      expect(seconds(IMAGE_CACHE_CONTROL, 'max-age')).toBeLessThan(
        seconds(IMAGE_CACHE_CONTROL, 's-maxage'),
      )
    })

    test('can be served stale while it revalidates', () => {
      expect(
        seconds(IMAGE_CACHE_CONTROL, 'stale-while-revalidate'),
      ).toBeGreaterThan(0)
    })

    test('is not marked immutable, which would stop a browser ever re-checking', () => {
      expect(IMAGE_CACHE_CONTROL).not.toContain('immutable')
    })
  })

  describe('for an upstream failure', () => {
    test('is shared-cacheable only briefly, so an outage does not hammer metvuw.com but recovery is quick', () => {
      expect(
        seconds(UPSTREAM_ERROR_CACHE_CONTROL, 's-maxage'),
      ).toBeLessThanOrEqual(60)
      expect(seconds(UPSTREAM_ERROR_CACHE_CONTROL, 'max-age')).toBe(0)
    })
  })
})
