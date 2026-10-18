'use client'

import { useAtom } from 'jotai'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { favoritePageAtom } from '@/components/Atoms/GlobalState'
import {
  favoritePageCookie,
  isSameOriginPath,
} from '@/shared/helpers/favoritePage'

// localStorage can hold anything, so apply the inline script's rule here too.
const storedFavoritePage = (): string | null => {
  try {
    const stored = JSON.parse(localStorage.getItem('favoritePage') || 'null')
    return typeof stored === 'string' ? stored : null
  } catch {
    return null
  }
}

const FavoritePageRedirect = () => {
  const [favoritePage] = useAtom(favoritePageAtom)
  const router = useRouter()
  const pathname = usePathname()

  // Mirror the favourite into a cookie so the proxy can redirect the home page
  // before it renders. Read from storage, not the atom, which starts as null
  // until it has loaded and would clear the cookie on every page load. This
  // also gives visitors who set a favourite before the cookie existed one.
  useEffect(() => {
    document.cookie = favoritePageCookie(storedFavoritePage())
  }, [favoritePage])

  useEffect(() => {
    // The inline script handles the first load; this covers in-app navigation to '/'.
    if (
      pathname === '/' &&
      favoritePage &&
      favoritePage !== '/' &&
      isSameOriginPath(favoritePage)
    ) {
      router.replace(favoritePage)
    }
  }, [favoritePage, pathname, router])

  return null
}

export default FavoritePageRedirect
