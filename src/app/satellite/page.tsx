import { Metadata } from 'next'

import NoForecast from '@/components/NoForecast'
import { SatellitePage } from '@/components/SatellitePage'
import { config } from '@/config'
import generateSEOMetadata from '@/shared/helpers/generateSEOMetadata'
import { getSatelliteChartData } from '@/shared/helpers/v2/dataSource/getWeatherChartData'

export const dynamic = 'force-dynamic'

export const generateMetadata = async (): Promise<Metadata> =>
  generateSEOMetadata({
    description: `Satellite wind & rain forecast charts. Optimized for mobile devices. Sourced from metvuw.com`,
    title: `metvuw mobile | Satellite`,
    url: new URL('satellite', config.baseUrl).href,
  })

export default async function Page() {
  const satelliteData = await getSatelliteChartData()
  if (satelliteData.length === 0) {
    return <NoForecast />
  }

  return <SatellitePage satelliteData={satelliteData} />
}
