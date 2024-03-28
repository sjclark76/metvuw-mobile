import { NextRequest, NextResponse } from 'next/server'

import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { determineImagesToAdd } from '@/shared/helpers/imageStorage/determineImagesToAdd'
import { removeImagesFromStorage } from '@/shared/helpers/imageStorage/removeImagesFromStorage'
import { uploadImagesToStorage } from '@/shared/helpers/imageStorage/uploadImagesToStorage'
import { scrapeRainImages } from '@/shared/helpers/screenScraper'
import { RainChartData } from '@/shared/types/rainChartData'
import { findRegionByCode } from '@/shared/types/region'

export async function GET(
  _request: NextRequest,
  { params }: { params: { region: string } },
): Promise<NextResponse<RainChartData[]>> {
  const regionCode = params.region ?? 'nz'

  const region = findRegionByCode(regionCode)

  if (!region)
    return new NextResponse(`invalid region code: ${regionCode}`, {
      status: 404,
    })

  const newImages: RainChartData[] = await scrapeRainImages(region)

  const { data } = await serviceRoleDb.storage
    .from('images')
    .list(`rain/${regionCode}`)

  const existingImages = data ?? []

  const imagesToAdd = determineImagesToAdd(newImages, existingImages)

  if (imagesToAdd.length > 0) {
    await removeImagesFromStorage(existingImages, `rain/${regionCode}`)
  }

  await uploadImagesToStorage(imagesToAdd)

  return NextResponse.json(newImages)
}
