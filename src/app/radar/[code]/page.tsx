import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import NoForecast from '@/components/NoForecast'
import { RadarPage } from '@/components/RadarPage'
import generateSEOMetadata from '@/shared/helpers/generateSEOMetadata'
import { getRadarChartDataForCode } from '@/shared/helpers/v2/dataSource/getWeatherChartData'
import { isRadarCode } from '@/shared/types/radarRegions'

type Props = {
  params: Promise<{ code: string }>
}
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // read route params
  const code = (await params).code

  return generateSEOMetadata({
    title: `metvuw mobile | Radar`,
    description: `Radar charts. Optimized for mobile devices. Sourced from metvuw.com`,
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
