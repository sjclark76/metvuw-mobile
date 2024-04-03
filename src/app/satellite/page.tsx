import { Metadata } from 'next'

import NoForecast from '@/components/NoForecast'
import { SatellitePage } from '@/components/SatellitePage'
import { config } from '@/config'
import generateSEOMetadata from '@/shared/helpers/generateSEOMetadata'
import { constructChartData } from '@/shared/helpers/v2/chartData/constructChartData'
import { retrieveImagesFromStorage } from '@/shared/helpers/v2/imageStorage'

export const dynamic = 'force-dynamic'

export const generateMetadata = async (): Promise<Metadata> =>
  generateSEOMetadata({
    description: `Satellite wind & rain forecast charts. Optimized for mobile devices. Sourced from metvuw.com`,
    title: `metvuw mobile | Satellite`,
    url: new URL('satellite', config.baseUrl).href,
  })

export default async function Page() {
  const path = 'satellite'

  const existingImages = await retrieveImagesFromStorage(path)

  if (existingImages.length === 0) {
    return <NoForecast />
  }

  const satelliteData = constructChartData(existingImages)

  return <SatellitePage satelliteData={satelliteData} />
}
