import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import NoForecast from '@/components/NoForecast'
import { RadarPage } from '@/components/RadarPage'
import { getRadarChartDataForCode } from '@/shared/helpers/dataSource/getWeatherChartData'
import generateSEOMetadata from '@/shared/helpers/generateSEOMetadata'
import { isRadarCode, radarRegions } from '@/shared/types/radarRegions'

type Props = {
  params: Promise<{ code: string }>
}
export const revalidate = 3600

// No pages are built ahead of time (so a build never needs metvuw.com to be up),
// and each is rendered on its first visit and then cached for `revalidate`
// seconds. Without this, a route with a parameter is rendered afresh on every
// visit, and never cached at all.
export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // read route params
  const code = (await params).code
  const station = isRadarCode(code) ? radarRegions[code] : code

  return generateSEOMetadata({
    title: `${station} rain radar | metvuw mobile`,
    description: `Rain radar for ${station}, easy to read on a phone. Charts from metvuw.com.`,
    url: `radar/${code}`,
  })
}
export default async function Page(props: {
  params: Promise<{ code: string }>
}) {
  const params = await props.params
  if (!isRadarCode(params.code)) {
    return notFound()
  }

  const radarData = await getRadarChartDataForCode(params.code)
  if (radarData.length === 0) {
    return <NoForecast />
  }

  return <RadarPage radarData={radarData} radarCode={params.code} />
}
