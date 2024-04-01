import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import RadarAndSatelliteImages from '@/components/RadarAndSatelliteImages'
import { config } from '@/config'
import generateSEOMetadata from '@/shared/helpers/generateSEOMetadata'
import { downloadRadarChartData } from '@/shared/helpers/s3Helper'
import { isRadarCode } from '@/shared/types/radarRegions'

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
  const allRadarData = await downloadRadarChartData()

  if (!isRadarCode(params.code)) {
    return notFound()
  }
  const filteredRadarData = allRadarData.filter(
    (radarImage) => radarImage.radarCode === params.code,
  )

  return (
    <RadarAndSatelliteImages images={filteredRadarData} chartType="Radar" />
  )
}
