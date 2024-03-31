import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import RadarAndSatelliteImages from '@/components/RadarAndSatelliteImages'
import { config } from '@/config'
import generateSEOMetadata from '@/shared/helpers/generateSEOMetadata'
import { constructChartData } from '@/shared/helpers/v2/chartData/constructChartData'
import { retrieveLatestImagesFromStorage } from '@/shared/helpers/v2/imageStorage'
import {
  balloonLocations,
  isBalloonLocationCode,
} from '@/shared/types/balloonLocations'

export const dynamic = 'force-dynamic'

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

  const path = `upper-air/${params.balloon}`

  const existingImages = await retrieveLatestImagesFromStorage(path)

  const chartData = constructChartData(existingImages, path)

  return (
    <RadarAndSatelliteImages
      images={chartData}
      chartType="Upper Air"
      headerText={`Upper Air Chart for ${balloonLocations[params.balloon]}`}
    />
  )
}
