import Script from 'next/script'

const measurementId = () => process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS

/**
 * The tag's queue and settings. Until Google's own script has loaded, `gtag` only
 * adds what it is given to `dataLayer`, and that script works through the queue
 * once it arrives; so an event sent before then (one sent as the page starts up,
 * say) is counted, not lost. Serialised into an inline script, so it must stay
 * self-contained: no imports, helpers or closed-over variables. `gtag` must be a
 * function, not an arrow: the tag reads its `arguments`.
 */
export function setUpGoogleTag(
  win: Window & { dataLayer?: unknown[] },
  id: string,
) {
  const queue = (win.dataLayer = win.dataLayer || [])
  // The named parameters are only for the types; the tag is given `arguments`.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function gtag(..._command: unknown[]) {
    queue.push(arguments)
  }
  win.gtag = gtag
  gtag('js', new Date())
  gtag('config', id)
}

/**
 * Goes in the page's <head>: a plain inline script runs as the page is read, before
 * any of the app's own code, so `gtag` is there for the first event. No id (for
 * example on a preview) means no analytics. The id is a JS string literal that is
 * also safe inside a <script> element ('<' escaped).
 */
export function GoogleTagSetup() {
  const id = measurementId()
  if (!id) return null
  const quotedId = JSON.stringify(id).replace(/</g, '\\u003c')
  return (
    <script
      id="google-analytics"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `(${setUpGoogleTag.toString()})(window, ${quotedId})`,
      }}
    />
  )
}

/** Google's script, loaded once the page is running; it sends what is queued. */
export function GoogleTag() {
  const id = measurementId()
  // No id means no analytics, not gtag/js?id=undefined.
  if (!id) return null
  return (
    <Script
      strategy="afterInteractive"
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`}
    />
  )
}
