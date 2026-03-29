import Script from 'next/script'

export function GoogleAdSense() {
  return (
    <Script
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9572839501955022"
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  )
}
