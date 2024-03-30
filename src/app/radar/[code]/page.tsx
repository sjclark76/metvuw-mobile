import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import RadarAndSatelliteImages from '@/components/RadarAndSatelliteImages'
import { config } from '@/config'
import generateSEOMetadata from '@/shared/helpers/generateSEOMetadata'
import { constructChartData } from '@/shared/helpers/v2/chartData/constructChartData'
import { retrieveLatestImagesFromStorage } from '@/shared/helpers/v2/imageStorage'
import { isRadarCode, radarRegions } from '@/shared/types/radarRegions'

export const dynamic = 'force-dynamic'

export const generateMetadata = async (): Promise<Metadata> =>
  generateSEOMetadata({
    title: `metvuw mobile | Radar`,
    description: `Radar charts. Optimized for mobile devices. Sourced from metvuw.com`,
    url: new URL('radar', config.baseUrl).href,
  })

export default async function RadarPage({
  params,
}: {
  params: { code: string }
}) {
  if (!isRadarCode(params.code)) {
    return notFound()
  }

  const path = `radar/${params.code}`

  const existingImages = await retrieveLatestImagesFromStorage(path)

  const filteredRadarData = constructChartData(existingImages, path, {
    height: 240,
    width: 240,
  })

  return (
    <RadarAndSatelliteImages
      images={filteredRadarData}
      chartType="Radar"
      headerText={`Radar Chart for ${radarRegions[params.code]}`}
    />
  )
}
