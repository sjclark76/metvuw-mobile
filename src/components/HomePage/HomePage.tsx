'use client'
import { useAtomValue } from 'jotai'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { favouritePageAtom } from '@/components/Navbar/state/favouritePageAtom'

export function HomePage() {
  const favouritePage = useAtomValue(favouritePageAtom)
  const pathname = usePathname()
  const router = useRouter()
  useEffect(() => {
    if (pathname === '/') {
      if (favouritePage !== undefined) {
        router.push(favouritePage)
      } else {
        router.push('/regions/nz')
      }
    }
  }, [pathname, favouritePage, router])

  return null
}
