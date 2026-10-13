import { isAllowedSourceUrl } from './allowedSourceUrl'

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
