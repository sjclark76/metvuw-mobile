import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import RadarAndSatelliteImages from '@/components/RadarAndSatelliteImages'
import { config } from '@/config'
import generateSEOMetadata from '@/shared/helpers/generateSEOMetadata'
import { downloadUpperAirChartData } from '@/shared/helpers/s3Helper'
import { isBalloonLocationCode } from '@/shared/types/balloonLocations'

export const generateMetadata = async (): Promise<Metadata> =>
  generateSEOMetadata({
    title: `metvuw mobile | Upper Air Data`,
    description: `Upper Air Data Optimized for mobile devices. Sourced from metvuw.com`,
    url: new URL('upperair', config.baseUrl).href,
  })

export default async function UpperAirPage({
  params,
}: {
  params: { balloon: string }
}) {
  if (!isBalloonLocationCode(params.balloon)) {
    // Redirect to a 404 page if the region is not found
    return notFound()
  }

  const allUpperAirImages = await downloadUpperAirChartData()

  const filteredImages = allUpperAirImages.filter(
    (upperAirImage) => upperAirImage.balloonLocationCode === params.balloon,
  )

  return (
    <RadarAndSatelliteImages images={filteredImages} chartType="Upper Air" />
  )
}
