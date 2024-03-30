import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import RegionPage from '@/components/RegionPage/region-page'
import serviceRoleDb from '@/shared/db/serviceRoleDb'
import generateSEOMetadata from '@/shared/helpers/generateSEOMetadata'
import { retrieveLatestImagesFromStorage } from '@/shared/helpers/v2/imageStorage'
import { RainChartData } from '@/shared/types/rainChartData'
import { findRegionByCode } from '@/shared/types/region'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // read route params
  const regionName = params.name
  return generateSEOMetadata({
    title: `metvuw mobile | ${regionName}`,
    description: `metvuw ${regionName} wind & rain forecast charts. Optimized for mobile devices. Sourced from metvuw.com`,
    url: `regions/${regionName}`,
  })
}

async function constructChartData(
  fileName: string,
  path: string,
  dimensions: { width: number; height: number },
): Promise<RainChartData> {
  const { data: publicUrl } = serviceRoleDb.storage
    .from('images')
    .getPublicUrl(path)

  const regex = /rain-(?<region>\w+)-thumb-(?<filename>\d+-\d+\.gif)/ // MODIFIED FROM OTHER CODE
  const match = fileName.match(regex)
  const fooName = match?.groups?.filename ?? ''
  const year = +fooName.slice(0, 4)
  const month = +fooName.slice(4, 6) - 1
  const day = +fooName.slice(6, 8)
  const hour = +fooName.slice(8, 10)

  const utcDate = Date.UTC(year, month, day, hour)
  const offset = +fooName.slice(11, 14)
  return {
    day: day,
    hour: hour,
    imageDateISO: new Date(utcDate).toISOString(),
    imageDateUTC: utcDate,
    month: month,
    name: fooName,
    path: '',
    url: publicUrl.publicUrl,
    ...dimensions,
    year: year,
    forecastDate: new Date(
      Date.UTC(year, month, day, hour + offset),
    ).toISOString(),
    offset: offset,
  }
}
interface Props {
  params: { name: string }
}

export default async function Region({ params }: Props) {
  const matchedRegion = findRegionByCode(params.name)

  if (!matchedRegion) {
    // Redirect to a 404 page if the region is not found
    return notFound()
  }

  const existingImages = await retrieveLatestImagesFromStorage(
    `rain/${matchedRegion.code}`,
  )

  const rainChartData = await Promise.all(
    existingImages.map((file) =>
      constructChartData(file.name, `rain/${matchedRegion.code}/${file.name}`, {
        height: 240,
        width: 240,
      }),
    ),
  )

  return <RegionPage region={matchedRegion} rainChartData={rainChartData} />
}
