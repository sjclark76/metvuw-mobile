import Script from 'next/script'

export function GoogleTag() {
  const measurementId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS
  // No id (for example on a preview) means no analytics, not gtag/js?id=undefined.
  if (!measurementId) return null
  // A JS string literal that is also safe inside a <script> element ('<' escaped).
  const quotedId = JSON.stringify(measurementId).replace(/</g, '\\u003c')

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
      ></Script>
      <Script id="google-analytics" strategy="afterInteractive">
        {` window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', ${quotedId});
             `}
      </Script>
    </>
  )
}
