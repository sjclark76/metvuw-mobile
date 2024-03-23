import RegionPage from '@/components/RegionPage/region-page'
import { findRegionByCode } from '@shared/region'
import { notFound } from 'next/navigation'
import { downloadRainChartData } from '@shared/helpers/s3Helper'

export default async function Region({ params }: { params: { name: string } }) {
  const matchedRegion = findRegionByCode(params.name)

  if (!matchedRegion) {
    // Redirect to a 404 page if the region is not found
    return notFound()
  }
  const rainChartData = await downloadRainChartData(matchedRegion.code)

  return <RegionPage region={matchedRegion} rainChartData={rainChartData} />
}
