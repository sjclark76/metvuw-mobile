'use client'
import { useCallback, useRef } from 'react'

import { track } from '@/shared/helpers/analytics/track'

/**
 * `track`, but each event is sent only the first time in this page view: for
 * things done again and again (dragging a slider), where once says the feature
 * is used. The page's components are made afresh for each page, so a new page
 * counts again.
 */
export function useTrackOnce() {
  const sent = useRef(new Set<string>())
  return useCallback(
    (name: string, params?: Record<string, string | number | boolean>) => {
      if (sent.current.has(name)) return
      sent.current.add(name)
      track(name, params)
    },
    [],
  )
}
