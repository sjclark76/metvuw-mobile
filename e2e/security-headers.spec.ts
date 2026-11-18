import { expect, test } from '@playwright/test'

const pages = ['/', '/satellite', '/radar/nl', '/upperair', '/offline']

test.describe('security headers', () => {
  test('every page sends the headers', async ({ request }) => {
    for (const path of pages) {
      const headers = (await request.get(path)).headers()

      expect(headers['x-content-type-options'], path).toBe('nosniff')
      expect(headers['referrer-policy'], path).toBe(
        'strict-origin-when-cross-origin',
      )
      expect(headers['permissions-policy'], path).toContain('camera=()')
      expect(headers['content-security-policy'], path).toBe(
        "frame-ancestors 'none'",
      )
      expect(headers['x-frame-options'], path).toBe('DENY')
      expect(headers['content-security-policy-report-only'], path).toContain(
        'report-uri /api/csp-report',
      )
    }
  })

  // Browsers post what the report-only policy would block here; the reports are
  // logged for the Vercel logs (see api/csp-report).
  test("takes a browser's report of what the policy would block", async ({
    request,
  }) => {
    const response = await request.post('/api/csp-report', {
      headers: { 'content-type': 'application/csp-report' },
      data: JSON.stringify({
        'csp-report': {
          'document-uri': 'http://localhost:3002/settings',
          'effective-directive': 'img-src',
          'blocked-uri': 'http://example.com/pixel.png',
        },
      }),
    })

    expect(response.status()).toBe(204)
  })

  // The policy lists Google's origins for ads and analytics, which these tests
  // do not load, so this guards the site's own scripts, styles, images and
  // service worker against a policy that is too tight.
  for (const path of pages) {
    test(`${path} breaks no Content-Security-Policy rule`, async ({ page }) => {
      await page.addInitScript(() => {
        const seen: string[] = []
        Object.assign(window, { __cspViolations: seen })
        document.addEventListener('securitypolicyviolation', (event) =>
          seen.push(`${event.effectiveDirective} ${event.blockedURI}`),
        )
      })

      await page.goto(path)
      await page.waitForSelector('nav')
      if (path !== '/offline') await page.waitForSelector('main img')
      await page.waitForTimeout(1000)
      if (path === '/satellite') {
        await page.getByLabel('Show animated weather chart').click()
        await page.waitForTimeout(1000)
      }

      expect(
        await page.evaluate(
          () =>
            (window as unknown as { __cspViolations: string[] })
              .__cspViolations,
        ),
      ).toEqual([])
    })
  }
})
