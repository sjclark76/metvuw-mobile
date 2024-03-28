import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import RadarAndSatelliteImages from '@/components/RadarAndSatelliteImages'
import { config } from '@/config'
import serviceRoleDb from '@/shared/db/serviceRoleDb'
import generateSEOMetadata from '@/shared/helpers/generateSEOMetadata'
import {
  balloonLocations,
  isBalloonLocationCode,
} from '@/shared/types/balloonLocations'
import { ChartData } from '@/shared/types/chartData'

export const generateMetadata = async (): Promise<Metadata> =>
  generateSEOMetadata({
    title: `metvuw mobile | Upper Air Data`,
    description: `Upper Air Data Optimized for mobile devices. Sourced from metvuw.com`,
    url: new URL('upperair', config.baseUrl).href,
  })

async function constructChartData(
  fileName: string,
  path: string,
  dimensions: { width: number; height: number },
): Promise<ChartData> {
  const { data: publicUrl } = serviceRoleDb.storage
    .from('images')
    .getPublicUrl(path)

  const year = +fileName.slice(0, 4)
  const month = +fileName.slice(4, 6) - 1
  const day = +fileName.slice(6, 8)
  const hour = +fileName.slice(8, 10)
  const utcDate = Date.UTC(year, month, day, hour)

  return {
    day: day,
    hour: hour,
    imageDateISO: new Date(utcDate).toISOString(),
    imageDateUTC: utcDate,
    month: month,
    name: fileName,
    path: '',
    url: publicUrl.publicUrl,
    ...dimensions,
    year: year,
  }
}

export default async function UpperAirPage({
  params,
}: {
  params: { balloon: string }
}) {
  if (!isBalloonLocationCode(params.balloon)) {
    // Redirect to a 404 page if the region is not found
    return notFound()
  }

  const { data } = await serviceRoleDb.storage
    .from('images')
    .list(`upper-air/${params.balloon}`, {
      limit: 200,
      offset: 0,
      search: '',
      sortBy: {
        column: 'name',
        order: 'asc',
      },
    })

  const existingImages = data ?? []

  const filteredImages = await Promise.all(
    existingImages.map((file) =>
      constructChartData(
        file.name,
        `upper-air/${params.balloon}/${file.name}`,
        {
          height: 200,
          width: 220,
        },
      ),
    ),
  )

  return (
    <RadarAndSatelliteImages
      images={filteredImages}
      chartType="Upper Air"
      headerText={`Upper Air Chart for ${balloonLocations[params.balloon]}`}
    />
  )
}
