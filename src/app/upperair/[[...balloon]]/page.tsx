import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import NoForecast from '@/components/NoForecast'
import { UpperAirPage } from '@/components/UpperAirPage'
import generateSEOMetadata from '@/shared/helpers/generateSEOMetadata'
import { constructChartData } from '@/shared/helpers/v2/chartData/constructChartData'
import { retrieveImagesFromStorage } from '@/shared/helpers/v2/imageStorage'
import { getsBalloonLocationCodeOrDefault } from '@/shared/types/balloonLocations'

export const dynamic = 'force-dynamic'
type Props = { balloon?: string[] }

export async function generateMetadata(props: Props): Promise<Metadata> {
  return generateSEOMetadata({
    title: `metvuw mobile | Upper Air Data`,
    description: `Upper Air Data Optimized for mobile devices. Sourced from metvuw.com`,
    url: `upperair/${props.balloon?.at(0) ?? ''}`,
  })
}

export default async function Page(props: { params: Promise<Props> }) {
  const params = await props.params

  const balloonLocationCode = getsBalloonLocationCodeOrDefault(
    params.balloon?.at(0),
  )

  if (balloonLocationCode == false) {
    // Redirect to a 404 page if the region is not found
    return notFound()
  }

  const path = `images/upper-air/${balloonLocationCode}`

  const existingImages = await retrieveImagesFromStorage(path)

  const chartData = constructChartData(existingImages)

  if (existingImages.length === 0) {
    return <NoForecast />
  }

  return (
    <UpperAirPage balloonCode={balloonLocationCode} chartData={chartData} />
  )
}
