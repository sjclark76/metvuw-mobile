import { allowedOriginFor, isAllowedSourceUrl } from './allowedSourceUrl'

const allowed = (url: string) => isAllowedSourceUrl(new URL(url))

describe('isAllowedSourceUrl', () => {
  test('allows https URLs on the metvuw host', () => {
    expect(allowed('https://metvuw.com/forecast/2026101318/rain.gif')).toBe(
      true,
    )
  })

  test('rejects non-https URLs', () => {
    expect(allowed('http://metvuw.com/forecast/rain.gif')).toBe(false)
  })

  test.each([
    ['another host', 'https://example.com/rain.gif'],
    ['a lookalike host', 'https://metvuw.com.evil.example/rain.gif'],
    ['a subdomain', 'https://evil.metvuw.com/rain.gif'],
    ['userinfo pointing elsewhere', 'https://metvuw.com@evil.example/rain.gif'],
    ['embedded credentials', 'https://user:pass@metvuw.com/rain.gif'],
    ['a non-default port', 'https://metvuw.com:8443/rain.gif'],
  ])('rejects %s', (_name, url) => {
    expect(allowed(url)).toBe(false)
  })
})

// The host we fetch must come from our own config, never from the request, so
// only the path and query are taken from a caller-supplied URL.
describe('allowedOriginFor', () => {
  test('returns the configured origin for an allowed URL', () => {
    expect(allowedOriginFor(new URL('https://metvuw.com/a/b.gif?x=1'))).toBe(
      'https://metvuw.com',
    )
  })

  test.each([
    'https://evil.example/a.gif',
    'http://metvuw.com/a.gif',
    'https://metvuw.com:8443/a.gif',
    'https://user:pw@metvuw.com/a.gif',
  ])('returns undefined for %s', (url) => {
    expect(allowedOriginFor(new URL(url))).toBeUndefined()
  })
})
