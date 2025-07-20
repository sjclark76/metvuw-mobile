'use client'
import { useEffect, useState } from 'react'

export const useIsStandalone = () => {
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // This check only runs on the client where `window` is available.
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(display-mode: standalone)')
      setIsStandalone(mediaQuery.matches)

      // Listen for changes in display mode
      const handleChange = (e: MediaQueryListEvent) => {
        setIsStandalone(e.matches)
      }

      mediaQuery.addEventListener('change', handleChange)

      // Cleanup the event listener
      return () => {
        mediaQuery.removeEventListener('change', handleChange)
      }
    }
  }, [])

  return isStandalone
}
