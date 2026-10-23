import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import NoForecast from '@/components/NoForecast'
import RegionPage from '@/components/RegionPage/RegionPage'
import { config } from '@/config'
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

/**
 * The home page: the New Zealand forecast, at the site's root. The root itself is
 * rewritten here (see `next.config.ts`) rather than being a page, because a page at
 * the root is built ahead of time, and the build then fails whenever metvuw.com is
 * down: no deploy could go out during an outage, not even a fix. A route with a
 * parameter is rendered on its first visit instead, and kept for an hour, as every
 * other chart page is. Only `nz` is a home page; anything else here is not found.
 */
const HOME_REGION = 'nz'

interface Props {
  params: Promise<{ region: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  // read route params
  const regionName = HOME_REGION
  return generateSEOMetadata({
    title: `metvuw mobile | ${regionName}`,
    description: `metvuw ${regionName} wind & rain forecast charts. Optimized for mobile devices. Sourced from metvuw.com`,
    url: `${config.baseUrl}`,
  })
}

export default async function Page(props: Props) {
  const { region } = await props.params
  const matchedRegion =
    region === HOME_REGION ? findRegionByCode(HOME_REGION) : undefined
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
