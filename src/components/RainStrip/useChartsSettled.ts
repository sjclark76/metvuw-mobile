'use client'
import { useEffect, useState } from 'react'

import { useImageProgress } from '@/components/ImageProgress/ImageProgress'

// A chart that never loads must not hold the strip back for ever.
const GIVE_UP_AFTER_MS = 5000

/**
 * True once the charts the page loads straight away have loaded, or after a few
 * seconds if they do not: the strip's reads wait for this, so they do not compete
 * with the charts the visitor is waiting to see.
 */
export function useChartsSettled(): boolean {
  const progress = useImageProgress()
  const [givenUp, setGivenUp] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setGivenUp(true), GIVE_UP_AFTER_MS)
    return () => clearTimeout(timer)
  }, [])
  return progress >= 100 || givenUp
}
