import { NextRequest } from 'next/server'

import { config, proxy } from './proxy'

const request = (
  country: string | null,
  cookies: Record<string, string> = {},
  path = '/satellite',
) =>
  new NextRequest(`https://metvuw.test${path}`, {
    headers: {
      ...(country ? { 'x-vercel-ip-country': country } : {}),
      cookie: Object.entries(cookies)
        .map(([name, value]) => `${name}=${value}`)
        .join('; '),
    },
  })

const setCookies = (response: Response) =>
  response.headers.getSetCookie().map((c) => c.split(';')[0])

describe('proxy cookies', () => {
  test('tells a first-time visitor their country and whether to show ads', () => {
    expect(setCookies(proxy(request('US')))).toEqual([
      'geo-country=US',
      'show-ads=1',
    ])
  })

  test('does not show ads to New Zealand visitors', () => {
    expect(setCookies(proxy(request('NZ')))).toEqual([
      'geo-country=NZ',
      'show-ads=0',
    ])
  })

  test('uses XX when the country is unknown', () => {
    expect(setCookies(proxy(request(null)))).toContain('geo-country=XX')
  })

  test('sets nothing when both cookies are already right', () => {
    const response = proxy(
      request('US', { 'geo-country': 'US', 'show-ads': '1' }),
    )

    expect(setCookies(response)).toEqual([])
  })

  test('sets only the cookie that is out of date', () => {
    const response = proxy(
      request('NZ', { 'geo-country': 'NZ', 'show-ads': '1' }),
    )

    expect(setCookies(response)).toEqual(['show-ads=0'])
  })

  test('refreshes a cookie when the visitor has moved country', () => {
    const response = proxy(
      request('AU', { 'geo-country': 'NZ', 'show-ads': '0' }),
    )

    expect(setCookies(response)).toEqual(['geo-country=AU', 'show-ads=1'])
  })

  test('keeps the cookie attributes the client relies on', () => {
    const [cookie] = proxy(request('US')).headers.getSetCookie()

    expect(cookie).toMatch(/Path=\//)
    expect(cookie).toMatch(/Max-Age=3600/)
    expect(cookie).toMatch(/SameSite=lax/i)
    expect(cookie).toMatch(/Secure/)
    expect(cookie).not.toMatch(/HttpOnly/i)
  })
})

describe('proxy favourite page', () => {
  const home = (favourite?: string) =>
    proxy(
      request(
        'NZ',
        favourite === undefined
          ? {}
          : { 'favorite-page': encodeURIComponent(favourite) },
        '/',
      ),
    )

  test('sends the home page to the favourite page, before it renders', () => {
    const response = home('/regions/nzsi')

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://metvuw.test/regions/nzsi',
    )
  })

  test('never lets a shared cache keep the redirect', () => {
    expect(home('/regions/nzsi').headers.get('cache-control')).toBe(
      'private, no-store',
    )
  })

  test('leaves the home page alone without a favourite', () => {
    const response = home()

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })

  test('leaves the home page alone when it is the favourite', () => {
    expect(home('/').headers.get('location')).toBeNull()
  })

  test('only redirects the home page', () => {
    const response = proxy(
      request('NZ', { 'favorite-page': '%2Fregions%2Fnzsi' }, '/satellite'),
    )

    expect(response.headers.get('location')).toBeNull()
  })

  test.each([
    '//evil.example/phish',
    '/\\evil.example',
    'https://evil.example',
    'javascript:alert(1)',
    'regions/nzsi',
  ])('ignores the unsafe favourite %j', (favourite) => {
    expect(home(favourite).headers.get('location')).toBeNull()
  })
})

describe('proxy matcher', () => {
  const [{ source, missing }] = config.matcher as {
    source: string
    missing: { type: string; key: string }[]
  }[]
  // Next anchors the pattern to the whole path.
  const runsFor = (path: string) => new RegExp(`^${source}$`).test(path)

  test.each([
    '/',
    '/satellite',
    '/radar/nl',
    '/regions/nzsi',
    '/upperair/93112',
  ])('runs for the page %s', (path) => {
    expect(runsFor(path)).toBe(true)
  })

  test.each([
    '/robots.txt',
    '/sitemap.xml',
    '/ads.txt',
    '/sw.js',
    '/manifest.json',
    '/favicon.ico',
    '/apple-icon-57x57.png',
    '/screenshot.png',
    '/.well-known/assetlinks.json',
    '/icons/icon-192.png',
    '/_next/static/chunks/main.js',
    '/_next/image',
    '/api/fallback-image',
  ])('skips %s', (path) => {
    expect(runsFor(path)).toBe(false)
  })

  test('skips prefetches, which never need the cookies', () => {
    expect(missing).toContainEqual(
      expect.objectContaining({ type: 'header', key: 'next-router-prefetch' }),
    )
  })
})
