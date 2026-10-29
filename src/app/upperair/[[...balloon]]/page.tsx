import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import NoForecast from '@/components/NoForecast'
import { UpperAirPage } from '@/components/UpperAirPage'
import { getUpperAirChartDataForCode } from '@/shared/helpers/dataSource/getWeatherChartData'
import generateSEOMetadata from '@/shared/helpers/generateSEOMetadata'
import { fetchSounding } from '@/shared/helpers/sounding/fetchSounding'
import {
  balloonLocations,
  getsBalloonLocationCodeOrDefault,
} from '@/shared/types/balloonLocations'

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
  const code = getsBalloonLocationCodeOrDefault(params.balloon?.at(0))
  const station = code ? balloonLocations[code] : 'New Zealand'
  return generateSEOMetadata({
    title: `${station} upper air charts | metvuw mobile`,
    description: `Upper air charts from the weather balloon launched at ${station}, easy to read on a phone. Charts from metvuw.com.`,
    url: `upperair/${code}`,
  })
}
interface Props {
  params: Promise<{ balloon?: string[] }>
}

export default async function Page(props: Props) {
  const params = await props.params

  const balloonLocationCode = getsBalloonLocationCodeOrDefault(
    params.balloon?.at(0),
  )

  if (balloonLocationCode == false) {
    // Redirect to a 404 page if the region is not found
    return notFound()
  }

  // metvuw's charts and the balloon data, side by side: neither waits on the other.
  const [chartData, sounding] = await Promise.all([
    getUpperAirChartDataForCode(balloonLocationCode),
    fetchSounding(balloonLocationCode),
  ])
  if (chartData.length === 0 && !sounding) {
    return <NoForecast />
  }

  return (
    <UpperAirPage
      balloonCode={balloonLocationCode}
      chartData={chartData}
      sounding={sounding}
    />
  )
}
