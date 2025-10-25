import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import NoForecast from '@/components/NoForecast'
import RegionPage from '@/components/RegionPage/region-page'
import { config } from '@/config'
import generateSEOMetadata from '@/shared/helpers/generateSEOMetadata'
import { constructRainChartData } from '@/shared/helpers/v2/chartData/constructRainChartData'
import { retrieveImagesFromStorage } from '@/shared/helpers/v2/imageStorage'
import { findRegionByCode } from '@/shared/types/region'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  // read route params
  const regionName = 'nz'
  return generateSEOMetadata({
    title: `metvuw mobile | ${regionName}`,
    description: `metvuw ${regionName} wind & rain forecast charts. Optimized for mobile devices. Sourced from metvuw.com`,
    url: `${config.baseUrl}`,
  })
}

export default async function Page() {
  const headersList = await headers()
  const country = headersList.get('x-user-country')

  const matchedRegion = findRegionByCode('nz')
  if (!matchedRegion) {
    // Redirect to a 404 page if the region is not found
    return notFound()
  }
  const path = `images/rain/nz`

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

  return (
    <>
      {country && (
        <div id="country-code" className="hidden">
          {country}
        </div>
      )}

      <RegionPage region={matchedRegion} rainChartData={sortedCharts} />
    </>
  )
}
