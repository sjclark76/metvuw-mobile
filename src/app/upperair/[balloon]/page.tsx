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

// async function constructChartData(
//   fileName: string,
//   path: string,
//   dimensions: { width: number; height: number },
// ): Promise<ChartData> {
//   const { data: publicUrl } = serviceRoleDb.storage
//     .from('images')
//     .getPublicUrl(path)
//
//   const year = +fileName.slice(0, 4)
//   const month = +fileName.slice(4, 6) - 1
//   const day = +fileName.slice(6, 8)
//   const hour = +fileName.slice(8, 10)
//   const utcDate = Date.UTC(year, month, day, hour)
//
//   return {
//     day: day,
//     hour: hour,
//     imageDateISO: new Date(utcDate).toISOString(),
//     imageDateUTC: utcDate,
//     month: month,
//     name: fileName,
//     url: publicUrl.publicUrl,
//     ...dimensions,
//     year: year,
//   }
// }

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
