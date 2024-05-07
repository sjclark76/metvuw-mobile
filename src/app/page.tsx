import { notFound } from 'next/navigation'

import HomePage from '@/components/HomePage'
import NoForecast from '@/components/NoForecast'
import { constructRainChartData } from '@/shared/helpers/v2/chartData/constructRainChartData'
import { retrieveImagesFromStorage } from '@/shared/helpers/v2/imageStorage'
import { findRegionByCode } from '@/shared/types/region'

export default async function Page() {
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

  return <HomePage region={matchedRegion} rainChartData={sortedCharts} />
}
