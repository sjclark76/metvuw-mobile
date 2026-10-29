import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import NoForecast from '@/components/NoForecast'
import { UpperAirPage } from '@/components/UpperAirPage'
import { UpperAirPageWithSounding } from '@/components/UpperAirPage/UpperAirPageWithSounding'
import { getUpperAirChartDataForCode } from '@/shared/helpers/dataSource/getWeatherChartData'
import generateSEOMetadata from '@/shared/helpers/generateSEOMetadata'
import { fetchSounding } from '@/shared/helpers/sounding/fetchSounding'
import {
  balloonLocations,
  getsBalloonLocationCodeOrDefault,
} from '@/shared/types/balloonLocations'

export const revalidate = 3600

// The balloon data can take Wyoming 8 to 12 s to send. Vercel stops a function
// at 10 s by default, before the answer comes, so it is never cached and every
// render times out; a minute (the most the plan allows) lets it come.
export const maxDuration = 60

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

  // Asked for at once, but not waited for: it can take Wyoming 8 to 12 s.
  const sounding = fetchSounding(balloonLocationCode)
  const chartData = await getUpperAirChartDataForCode(balloonLocationCode)

  if (chartData.length === 0) {
    // Nothing of metvuw's to show meanwhile: the page is the balloon's or none.
    const fetched = await sounding
    if (!fetched) return <NoForecast />
    return (
      <UpperAirPage
        balloonCode={balloonLocationCode}
        chartData={chartData}
        sounding={fetched}
      />
    )
  }

  // metvuw's charts are sent straight away; the balloon's panel (and our chart,
  // if metvuw's are older) replace them when it answers. Once the answer is
  // cached it comes at once, and the page is sent whole.
  return (
    <Suspense
      fallback={
        <UpperAirPage balloonCode={balloonLocationCode} chartData={chartData} />
      }
    >
      <UpperAirPageWithSounding
        balloonCode={balloonLocationCode}
        chartData={chartData}
        sounding={sounding}
      />
    </Suspense>
  )
}
