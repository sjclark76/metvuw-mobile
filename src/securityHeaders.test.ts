import { contentSecurityPolicy, securityHeaders } from './securityHeaders'

const header = (name: string) =>
  securityHeaders.find((h) => h.key.toLowerCase() === name.toLowerCase())

const directive = (name: string) =>
  contentSecurityPolicy
    .split(';')
    .map((part) => part.trim().split(/\s+/))
    .find(([key]) => key === name)
    ?.slice(1)

describe('security headers', () => {
  test('stops browsers guessing content types', () => {
    expect(header('X-Content-Type-Options')?.value).toBe('nosniff')
  })

  test('limits the referrer to the origin when leaving the site', () => {
    expect(header('Referrer-Policy')?.value).toBe(
      'strict-origin-when-cross-origin',
    )
  })

  test('denies powerful features the app does not use', () => {
    const policy = header('Permissions-Policy')?.value ?? ''

    for (const feature of ['camera', 'microphone', 'payment']) {
      expect(policy).toContain(`${feature}=()`)
    }
  })

  test('allows location for this site only, for pinning where you are', () => {
    const policy = header('Permissions-Policy')?.value ?? ''

    expect(policy).toContain('geolocation=(self)')
  })

  test('sends exactly one Content-Security-Policy header', () => {
    const names = securityHeaders.map((h) => h.key.toLowerCase())

    expect(
      names.filter((n) => n.startsWith('content-security-policy')),
    ).toHaveLength(1)
  })

  describe('Content-Security-Policy', () => {
    test('defaults to the site itself', () => {
      expect(directive('default-src')).toEqual(["'self'"])
    })

    test('cannot be framed, and cannot be given a <base> or plugins', () => {
      expect(directive('frame-ancestors')).toEqual(["'none'"])
      expect(directive('object-src')).toEqual(["'none'"])
      expect(directive('base-uri')).toEqual(["'self'"])
    })

    test('forms can only post back to the site', () => {
      expect(directive('form-action')).toEqual(["'self'"])
    })

    test('scripts load from the site, Google Tag Manager and AdSense only', () => {
      const origins = (directive('script-src') ?? []).filter((s) =>
        s.startsWith('https:'),
      )

      expect(origins).toContain('https://www.googletagmanager.com')
      expect(origins).toContain('https://pagead2.googlesyndication.com')
      expect(directive('script-src')).not.toContain('https:')
      expect(directive('script-src')).not.toContain('*')
    })

    test('frames are limited to Google ad hosts', () => {
      const frames = directive('frame-src') ?? []

      expect(frames).not.toContain("'self'")
      expect(frames).not.toContain('*')
      expect(frames).toContain('https://googleads.g.doubleclick.net')
    })

    test('connections are limited to the site and Google analytics and ads', () => {
      const connect = directive('connect-src') ?? []

      expect(connect).toContain("'self'")
      expect(connect).toContain('https://*.google-analytics.com')
      expect(connect).not.toContain('https:')
      expect(connect).not.toContain('*')
    })

    test('never allows eval', () => {
      expect(contentSecurityPolicy).not.toContain("'unsafe-eval'")
    })

    test('leaves the service worker and manifest to the site', () => {
      expect(directive('worker-src')).toEqual(["'self'"])
      expect(directive('manifest-src')).toEqual(["'self'"])
    })
  })
})
