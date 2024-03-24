import generateSEOMetadata from '@shared/helpers/generateSEOMetadata'
import { downloadRainChartData } from '@shared/helpers/s3Helper'
import { findRegionByCode } from '@shared/region'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import RegionPage from '@/components/RegionPage/region-page'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // read route params
  const regionName = params.name
  return generateSEOMetadata({
    title: `metvuw mobile | ${regionName}`,
    description: `metvuw ${regionName} wind & rain forecast charts. Optimized for mobile devices. Sourced from metvuw.com`,
    url: `regions/${regionName}`,
  })
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
  const rainChartData = await downloadRainChartData(matchedRegion.code)

  return <RegionPage region={matchedRegion} rainChartData={rainChartData} />
}
