import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import NoForecast from '@/components/NoForecast'
import RegionPage from '@/components/RegionPage/region-page'
import { config } from '@/config'
import generateSEOMetadata from '@/shared/helpers/generateSEOMetadata'
import { getRainChartDataForRegion } from '@/shared/helpers/v2/dataSource/getWeatherChartData'
import { findRegionByCode } from '@/shared/types/region'

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
  const matchedRegion = findRegionByCode('nz')
  if (!matchedRegion) {
    // Redirect to a 404 page if the region is not found
    return notFound()
  }
  const rainChartData = await getRainChartDataForRegion(matchedRegion)
  if (rainChartData.length === 0) {
    return <NoForecast />
  }

  const sortedCharts = rainChartData.sort((a, b) => {
    return (
      new Date(a.imageDateUTC).getTime() - new Date(b.imageDateUTC).getTime()
    )
  })

  return <RegionPage region={matchedRegion} rainChartData={sortedCharts} />
}
