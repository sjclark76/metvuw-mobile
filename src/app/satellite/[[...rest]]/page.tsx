import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import NoForecast from '@/components/NoForecast'
import { SatellitePage } from '@/components/SatellitePage'
import { config } from '@/config'
import { getSatelliteChartData } from '@/shared/helpers/dataSource/getWeatherChartData'
import generateSEOMetadata from '@/shared/helpers/generateSEOMetadata'

export const revalidate = 3600

// No pages are built ahead of time (so a build never needs metvuw.com to be up),
// and each is rendered on its first visit and then cached for `revalidate`
// seconds. Without this, a route with a parameter is rendered afresh on every
// visit, and never cached at all.
export function generateStaticParams() {
  return []
}

/**
 * The satellite page, at /satellite. It takes an optional rest of the path (and
 * is not found for any) only so that it is a route with a parameter: one without
 * is built ahead of time, and the build then fails whenever metvuw.com is down,
 * so no deploy could go out during an outage. Like the other chart pages it is
 * rendered on its first visit and kept for an hour.
 */
interface Props {
  params: Promise<{ rest?: string[] }>
}

export const generateMetadata = async (): Promise<Metadata> =>
  generateSEOMetadata({
    description: `Satellite wind & rain forecast charts. Optimized for mobile devices. Sourced from metvuw.com`,
    title: `metvuw mobile | Satellite`,
    url: new URL('satellite', config.baseUrl).href,
  })

export default async function Page(props: Props) {
  const { rest } = await props.params
  if (rest?.length) return notFound()

  const satelliteData = await getSatelliteChartData()
  if (satelliteData.length === 0) {
    return <NoForecast />
  }

  return <SatellitePage satelliteData={satelliteData} />
}
