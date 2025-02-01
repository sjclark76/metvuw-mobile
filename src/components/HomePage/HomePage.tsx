'use client'
import { useAtomValue } from 'jotai'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { favouritePageAtom } from '@/components/Navbar/state/favouritePageAtom'
import RegionPage from '@/components/RegionPage/region-page'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { Region } from '@/shared/types/region'

interface Props {
  region: Region
  rainChartData: SkinnyRainChartData[]
}
export function HomePage(props: Props) {
  const favouritePage = useAtomValue(favouritePageAtom)
  const pathname = usePathname()
  const router = useRouter()
  useEffect(() => {
    if (pathname === '/') {
      if (favouritePage !== undefined) {
        router.push(favouritePage)
      }
    }
  }, [pathname, favouritePage, router])

  return (
    <RegionPage region={props.region} rainChartData={props.rainChartData} />
  )
}
