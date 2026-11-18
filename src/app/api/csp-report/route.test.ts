import type { MockInstance } from 'vitest'

import { POST } from './route'

const post = (body: string, headers: Record<string, string> = {}) =>
  POST(
    new Request('http://localhost/api/csp-report', {
      method: 'POST',
      body,
      headers,
    }),
  )

const logged = (warn: { mock: { calls: unknown[][] } }) =>
  warn.mock.calls.map(
    ([line]) =>
      JSON.parse(String(line).replace(/^\[csp\] /, '')) as Record<
        string,
        string
      >,
  )

describe('POST /api/csp-report', () => {
  let warn: MockInstance<typeof console.warn>
  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => warn.mockRestore())

  test('logs a report-uri report (Firefox, Safari) as one line', async () => {
    const response = await post(
      JSON.stringify({
        'csp-report': {
          'document-uri': 'https://www.metvuwmobile.com/regions/nz?x=1',
          'effective-directive': 'frame-src',
          'violated-directive': 'frame-src',
          'blocked-uri': 'https://ads.example.com/frame?long=query',
          'source-file': 'https://pagead2.googlesyndication.com/a.js',
          'line-number': 12,
          disposition: 'report',
        },
      }),
      { 'content-type': 'application/csp-report' },
    )

    expect(response.status).toBe(204)
    expect(logged(warn)).toEqual([
      {
        page: 'https://www.metvuwmobile.com/regions/nz',
        directive: 'frame-src',
        blocked: 'https://ads.example.com/frame',
        source: 'https://pagead2.googlesyndication.com/a.js:12',
        disposition: 'report',
      },
    ])
  })

  test('logs each csp-violation in a Reporting API batch (Chrome)', async () => {
    const response = await post(
      JSON.stringify([
        {
          type: 'csp-violation',
          body: {
            documentURL: 'https://www.metvuwmobile.com/radar/nl',
            effectiveDirective: 'connect-src',
            blockedURL: 'https://stats.example.com/collect',
            disposition: 'report',
          },
        },
        { type: 'deprecation', body: { id: 'x' } },
        {
          type: 'csp-violation',
          body: {
            documentURL: 'https://www.metvuwmobile.com/',
            effectiveDirective: 'img-src',
            blockedURL: 'http://insecure.example.com/pixel.gif',
            disposition: 'report',
          },
        },
      ]),
      { 'content-type': 'application/reports+json' },
    )

    expect(response.status).toBe(204)
    expect(logged(warn).map((v) => v.directive)).toEqual([
      'connect-src',
      'img-src',
    ])
  })

  test("ignores what the visitor's browser extensions caused", async () => {
    await post(
      JSON.stringify({
        'csp-report': {
          'effective-directive': 'script-src',
          'blocked-uri': 'chrome-extension://abc/inject.js',
        },
      }),
    )

    expect(warn).not.toHaveBeenCalled()
  })

  test('refuses what is not JSON, and what is too large to be a report', async () => {
    expect((await post('not json')).status).toBe(400)
    expect((await post('x'.repeat(70 * 1024))).status).toBe(413)
    expect(
      (await post('{}', { 'content-length': String(1024 * 1024) })).status,
    ).toBe(413)
    expect(warn).not.toHaveBeenCalled()
  })
})
