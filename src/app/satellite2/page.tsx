import { Metadata } from 'next'

import RadarAndSatelliteImages from '@/components/RadarAndSatelliteImages'
import { config } from '@/config'
import serviceRoleDb from '@/shared/db/serviceRoleDb'
import generateSEOMetadata from '@/shared/helpers/generateSEOMetadata'
import { ChartData } from '@/shared/types/chartData'

async function constructChartData(
  fileName: string,
  // absoluteURL: URL,
  dimensions: { width: number; height: number },
): Promise<ChartData> {
  const { data: publicUrl } = serviceRoleDb.storage
    .from('satellite')
    .getPublicUrl(fileName)

  const year = +fileName.slice(0, 4)
  const month = +fileName.slice(4, 6) - 1
  const day = +fileName.slice(6, 8)
  const hour = +fileName.slice(8, 10)
  const utcDate = Date.UTC(year, month, day, hour)
  // const originalFileName = path.basename(absoluteURL.pathname)

  return {
    day: day,
    hour: hour,
    imageDateISO: new Date(utcDate).toISOString(),
    imageDateUTC: utcDate,
    month: month,
    name: fileName,
    publicUrl: '',
    url: publicUrl.publicUrl,
    ...dimensions,
    year: year,
  }
}

export const generateMetadata = async (): Promise<Metadata> =>
  generateSEOMetadata({
    description: `Satellite wind & rain forecast charts. Optimized for mobile devices. Sourced from metvuw.com`,
    title: `metvuw mobile | Satellite`,
    url: new URL('satellite', config.baseUrl).href,
  })

export default async function SatellitePage() {
  // const satelliteData = await downloadSatelliteChartData()

  const { data } = await serviceRoleDb.storage.from('satellite').list()

  const existingImages = data ?? []

  const satelliteData = await Promise.all(
    existingImages.map((file) =>
      constructChartData(file.name, { height: 210, width: 280 }),
    ),
  )

  return (
    <RadarAndSatelliteImages
      images={satelliteData}
      chartType="Satellite"
      headerText="Satellite Imagery for New Zealand"
    />
  )
}
