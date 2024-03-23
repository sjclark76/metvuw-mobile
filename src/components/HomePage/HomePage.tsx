'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAtomValue } from 'jotai'
import { favouritePageAtom } from '@/components/Navbar/state/favouritePageAtom'

export function HomePage() {
  const favouritePage = useAtomValue(favouritePageAtom)
  const pathname = usePathname()
  console.log('stuart', 'rendering home page')
  const router = useRouter()
  useEffect(() => {
    console.log('stuart', { pathname })
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
