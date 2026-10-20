'use client'
import { useMemo } from 'react'

import { useIsMounted } from '@/components/Hooks/useIsMounted'

import { useSavedPageList } from './useSavedPages'

const none: ReadonlySet<string> = new Set()

/**
 * The addresses of the pages saved for offline use. What is saved is only known
 * in the browser, so this is empty until the page is running there: the page the
 * host rendered, and the one React hydrates, must match.
 */
export function useSavedPaths(): ReadonlySet<string> {
  const isMounted = useIsMounted()
  const { pages } = useSavedPageList()

  return useMemo(
    () => (isMounted ? new Set(pages.map((page) => page.path)) : none),
    [isMounted, pages],
  )
}
