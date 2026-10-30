// Preloaded into the app's Node process (`--import`) when METVUW_STUB_ORIGIN is
// set, so the pages' server-side fetches of metvuw.com, and of the University of Wyoming's balloon data, and of MetService's alerts, go to the e2e stub
// instead. It lives outside the app: the app's allowlist stays pinned to
// https://metvuw.com, and nothing here ships to production.

// The hosts the app's server fetches from.
const STUBBED_HOSTS = new Set([
  'metvuw.com',
  'weather.uwyo.edu',
  'alerts.metservice.com',
])

export function redirectMetvuw(realFetch, stubOrigin) {
  const stub = new URL(stubOrigin)

  return function fetchWithStubbedMetvuw(input, init) {
    const original =
      input instanceof Request ? input.url : new URL(String(input)).href
    const url = new URL(original)

    if (!STUBBED_HOSTS.has(url.hostname)) return realFetch(input, init)

    url.protocol = stub.protocol
    url.host = stub.host
    return realFetch(
      input instanceof Request ? new Request(url, input) : url,
      init,
    )
  }
}

if (process.env.METVUW_STUB_ORIGIN) {
  globalThis.fetch = redirectMetvuw(
    globalThis.fetch,
    process.env.METVUW_STUB_ORIGIN,
  )
}
