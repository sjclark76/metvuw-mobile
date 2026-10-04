'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

/**
 * Loads the AdSense script only for visitors who are shown ads (the 'show-ads'
 * cookie set by the middleware), so domestic visitors don't make the request.
 * The cookie is read after mount to keep the server render and hydration identical.
 */
export function GoogleAdSense() {
  const [showAds, setShowAds] = useState(false)

  useEffect(() => {
    setShowAds(/(^| )show-ads=1(;|$)/.test(document.cookie))
  }, [])

  if (!showAds) return null

  return (
    <Script
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9572839501955022"
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  )
}
