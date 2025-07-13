'use client'

import { useEffect, useState } from 'react'

export default function InstallPWA() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))
    setIsStandalone(
      'standalone' in window.navigator &&
        (window.navigator as any).standalone === true,
    )
  }, [])

  if (!isIOS || isStandalone) {
    return null
  }

  return (
    <div className="fixed right-0 bottom-0 left-0 bg-white p-4 text-center shadow-lg">
      <p className="font-semibold">Install Metvuw Mobile!</p>
      <p className="text-sm">
        Tap the &quot;Share&quot; button and then &quot;Add to Home
        Screen&quot;.
      </p>
    </div>
  )
}
