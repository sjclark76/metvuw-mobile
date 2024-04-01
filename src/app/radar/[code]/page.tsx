import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import NoForecast from '@/components/NoForecast'
import { RadarPage } from '@/components/RadarPage'
import { config } from '@/config'
import generateSEOMetadata from '@/shared/helpers/generateSEOMetadata'
import { constructChartData } from '@/shared/helpers/v2/chartData/constructChartData'
import { retrieveLatestImagesFromStorage } from '@/shared/helpers/v2/imageStorage'
import { isRadarCode } from '@/shared/types/radarRegions'

export const dynamic = 'force-dynamic'

export const generateMetadata = async (): Promise<Metadata> =>
  generateSEOMetadata({
    title: `metvuw mobile | Radar`,
    description: `Radar charts. Optimized for mobile devices. Sourced from metvuw.com`,
    url: new URL('radar', config.baseUrl).href,
  })

export default async function Page({ params }: { params: { code: string } }) {
  if (!isRadarCode(params.code)) {
    return notFound()
  }

  const path = `radar/${params.code}`

  const existingImages = await retrieveLatestImagesFromStorage(path)

  if (existingImages.length === 0) {
    return <NoForecast />
  }

  const radarData = constructChartData(existingImages, path)

  return <RadarPage radarData={radarData} radarCode={params.code} />
}
