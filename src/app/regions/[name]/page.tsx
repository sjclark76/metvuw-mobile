import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import NoForecast from '@/components/NoForecast'
import RegionPage from '@/components/RegionPage/RegionPage'
import { getRainChartDataForRegion } from '@/shared/helpers/dataSource/getWeatherChartData'
import generateSEOMetadata from '@/shared/helpers/generateSEOMetadata'
import { findRegionByCode } from '@/shared/types/region'

export const revalidate = 3600

// No pages are built ahead of time (so a build never needs metvuw.com to be up),
// and each is rendered on its first visit and then cached for `revalidate`
// seconds. Without this, a route with a parameter is rendered afresh on every
// visit, and never cached at all.
export function generateStaticParams() {
  return []
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  // read route params
  const regionName = findRegionByCode(params.name)?.name ?? params.name
  return generateSEOMetadata({
    title: `${regionName} rain & wind forecast | metvuw mobile`,
    description: `Rain and wind forecast charts for ${regionName}, every six hours for the next ten days, easy to read on a phone. Charts from metvuw.com.`,
    url: `regions/${params.name}`,
  })
}

interface Props {
  params: Promise<{ name: string }>
}

export default async function Region(props: Props) {
  const params = await props.params
  const matchedRegion = findRegionByCode(params.name)

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
