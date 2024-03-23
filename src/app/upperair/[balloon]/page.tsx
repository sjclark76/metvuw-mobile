import { downloadUpperAirChartData } from '@shared/helpers/s3Helper'
import { isBalloonLocationCode } from '@shared/balloonLocations'

import { notFound } from 'next/navigation'
import RadarAndSatelliteImages from '@/components/RadarAndSatelliteImages'

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
    <RadarAndSatelliteImages images={filteredImages} chartType={'Upper Air'} />
  )
}
