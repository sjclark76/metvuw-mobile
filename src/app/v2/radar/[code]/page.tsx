import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import RadarAndSatelliteImages from '@/components/RadarAndSatelliteImages'
import { config } from '@/config'
import serviceRoleDb from '@/shared/db/serviceRoleDb'
import generateSEOMetadata from '@/shared/helpers/generateSEOMetadata'
import { ChartData } from '@/shared/types/chartData'
import { isRadarCode, radarRegions } from '@/shared/types/radarRegions'

export const generateMetadata = async (): Promise<Metadata> =>
  generateSEOMetadata({
    title: `metvuw mobile | Radar`,
    description: `Radar charts. Optimized for mobile devices. Sourced from metvuw.com`,
    url: new URL('radar', config.baseUrl).href,
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
export default async function RadarPage({
  params,
}: {
  params: { code: string }
}) {
  if (!isRadarCode(params.code)) {
    return notFound()
  }

  const { data } = await serviceRoleDb.storage
    .from('images')
    .list(`radar/${params.code}`, {
      limit: 200,
      offset: 0,
      search: '',
      sortBy: {
        column: 'name',
        order: 'asc',
      },
    })

  const existingImages = data ?? []

  const filteredRadarData = await Promise.all(
    existingImages.map((file) =>
      constructChartData(file.name, `radar/${params.code}/${file.name}`, {
        height: 240,
        width: 240,
      }),
    ),
  )

  return (
    <RadarAndSatelliteImages
      images={filteredRadarData}
      chartType="Radar"
      headerText={`Radar Chart for ${radarRegions[params.code]}`}
    />
  )
}
