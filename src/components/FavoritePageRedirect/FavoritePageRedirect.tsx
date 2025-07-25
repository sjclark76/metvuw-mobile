'use client'

import { useAtom } from 'jotai'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { favoritePageAtom } from '@/components/Atoms/GlobalState'

const FavoritePageRedirect = () => {
  const [favoritePage] = useAtom(favoritePageAtom)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/' && favoritePage) {
      router.replace(favoritePage)
    }
  }, [favoritePage, pathname, router])

  return null
}

export default FavoritePageRedirect
