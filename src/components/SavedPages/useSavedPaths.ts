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
    () =>
      isMounted
        ? new Set(pages.flatMap((page) => [page.path, ...(page.aliases ?? [])]))
        : none,
    [isMounted, pages],
  )
}

/**
 * How many pages are saved. Not the number of addresses: one page can have two
 * (the home page is the New Zealand forecast). Zero until the page is running in
 * the browser, for the same reason as `useSavedPaths`.
 */
export function useSavedPageCount(): number {
  const isMounted = useIsMounted()
  const { pages } = useSavedPageList()

  return isMounted ? pages.length : 0
}
