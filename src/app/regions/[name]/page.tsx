import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import NoForecast from '@/components/NoForecast'
import RegionPage from '@/components/RegionPage/region-page'
import generateSEOMetadata from '@/shared/helpers/generateSEOMetadata'
import { constructRainChartData } from '@/shared/helpers/v2/chartData/constructRainChartData'
import { retrieveImagesFromStorage } from '@/shared/helpers/v2/imageStorage'
import { findRegionByCode } from '@/shared/types/region'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // read route params
  const regionName = params.name
  return generateSEOMetadata({
    title: `metvuw mobile | ${regionName}`,
    description: `metvuw ${regionName} wind & rain forecast charts. Optimized for mobile devices. Sourced from metvuw.com`,
    url: `regions/${regionName}`,
  })
}

interface Props {
  params: { name: string }
}

export default async function Region({ params }: Props) {
  const matchedRegion = findRegionByCode(params.name)

  if (!matchedRegion) {
    // Redirect to a 404 page if the region is not found
    return notFound()
  }

  const path = `images/rain/${matchedRegion.code}`
  const existingImages = await retrieveImagesFromStorage(path)

  if (existingImages.length === 0) {
    return <NoForecast />
  }

  const rainChartData = constructRainChartData(existingImages)

  const sortedCharts = rainChartData.sort((a, b) => {
    return (
      new Date(a.imageDateUTC).getTime() - new Date(b.imageDateUTC).getTime()
    )
  })

  return <RegionPage region={matchedRegion} rainChartData={sortedCharts} />
}
