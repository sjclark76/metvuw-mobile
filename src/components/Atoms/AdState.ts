import { atom } from 'jotai'
import { useSetAtom } from 'jotai'
import { useEffect } from 'react'

/**
 * Writable atom that determines whether ads should be shown.
 * Initialized to false to match server render, then updated
 * client-side from the 'show-ads' cookie to avoid hydration mismatch.
 */
export const showAdsAtom = atom<boolean>(false)

/**
 * Hook to sync the showAds atom with the 'show-ads' cookie after mount.
 * Must be called in a client component within a jotai Provider.
 */
export function useInitShowAds() {
  const setShowAds = useSetAtom(showAdsAtom)
  useEffect(() => {
    const match = document.cookie.match(/(^| )show-ads=([^;]+)/)
    setShowAds(match?.[2] === '1')
  }, [setShowAds])
}
