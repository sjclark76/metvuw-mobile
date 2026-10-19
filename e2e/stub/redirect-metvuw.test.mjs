import { redirectMetvuw } from './redirect-metvuw.mjs'

const STUB = 'http://127.0.0.1:4010'

function setup() {
  const calls = []
  const realFetch = async (input, init) => {
    calls.push({ input, init })
    return new Response('ok')
  }
  return { calls, fetch: redirectMetvuw(realFetch, STUB) }
}

const requestedUrl = (call) =>
  call.input instanceof Request ? call.input.url : String(call.input)

describe('redirectMetvuw', () => {
  test('sends metvuw.com to the stub, keeping the path and query', async () => {
    const { calls, fetch } = setup()

    await fetch('https://metvuw.com/forecast/forecast.php?type=rain&region=nz')

    expect(requestedUrl(calls[0])).toBe(
      `${STUB}/forecast/forecast.php?type=rain&region=nz`,
    )
  })

  test('accepts a URL object', async () => {
    const { calls, fetch } = setup()

    await fetch(new URL('https://metvuw.com/satellite'))

    expect(requestedUrl(calls[0])).toBe(`${STUB}/satellite`)
  })

  test('accepts a Request, keeping its method and headers', async () => {
    const { calls, fetch } = setup()

    await fetch(
      new Request('https://metvuw.com/upperair', {
        method: 'POST',
        headers: { 'x-test': '1' },
      }),
    )

    expect(requestedUrl(calls[0])).toBe(`${STUB}/upperair`)
    expect(calls[0].input.method).toBe('POST')
    expect(calls[0].input.headers.get('x-test')).toBe('1')
  })

  test('passes the options through', async () => {
    const { calls, fetch } = setup()
    const init = { redirect: 'manual' }

    await fetch('https://metvuw.com/a.gif', init)

    expect(calls[0].init).toBe(init)
  })

  test.each([
    'https://example.com/a',
    'https://www.metvuw.com/a',
    'https://metvuw.com.evil.example/a',
    'https://evil.example/?https://metvuw.com/a',
  ])('leaves %s alone', async (url) => {
    const { calls, fetch } = setup()

    await fetch(url)

    expect(requestedUrl(calls[0])).toBe(url)
  })

  test('does nothing on import unless METVUW_STUB_ORIGIN is set', () => {
    // The module patched nothing when it was imported above: otherwise every
    // vitest run would have a rewritten global fetch.
    expect(String(globalThis.fetch)).not.toContain('fetchWithStubbedMetvuw')
  })
})
