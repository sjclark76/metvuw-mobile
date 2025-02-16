import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import NoForecast from '@/components/NoForecast'
import { RadarPage } from '@/components/RadarPage'
import generateSEOMetadata from '@/shared/helpers/generateSEOMetadata'
import { constructChartData } from '@/shared/helpers/v2/chartData/constructChartData'
import { retrieveImagesFromStorage } from '@/shared/helpers/v2/imageStorage'
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

  const path = `images/radar/${params.code}`

  const existingImages = await retrieveImagesFromStorage(path)

  if (existingImages.length === 0) {
    return <NoForecast />
  }

  const radarData = constructChartData(existingImages)

  return <RadarPage radarData={radarData} radarCode={params.code} />
}
