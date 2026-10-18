'use client'

import { useAtom } from 'jotai'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { favoritePageAtom } from '@/components/Atoms/GlobalState'

// localStorage can hold anything, so apply the inline script's rule here too:
// same-origin paths only ('//host' would be a protocol-relative URL).
const isSameOriginPath = (path: string) =>
  path.startsWith('/') && !path.startsWith('//')

const FavoritePageRedirect = () => {
  const [favoritePage] = useAtom(favoritePageAtom)
  const router = useRouter()
  const pathname = usePathname()

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
