import { atom } from 'jotai'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
  return match ? match[2] : null
}

/**
 * Read-only atom that determines whether ads should be shown.
 * Reads from the 'show-ads' cookie set by edge middleware.
 * Returns true for non-NZ/AU users. Defaults to false if cookie is missing.
 */
export const showAdsAtom = atom<boolean>(() => {
  return getCookie('show-ads') === '1'
})
