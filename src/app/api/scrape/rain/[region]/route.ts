import { NextRequest, NextResponse } from 'next/server'

import {
  determineImagesToAdd,
  removeImagesFromStorage,
  retrieveLatestImagesFromStorage,
  uploadImagesToStorage,
} from '@/shared/helpers/v2/imageStorage'
import {
  scrapeRainImages,
  scrapeUpperAirImages,
} from '@/shared/helpers/v2/screenScraper'
import { findRegionByCode } from '@/shared/types/region'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { region: string } },
) {
  const regionCode = params.region ?? 'nz'

  const region = findRegionByCode(regionCode)

  if (!region)
    return new NextResponse(`invalid region code: ${regionCode}`, {
      status: 404,
    })

  const newImages = await scrapeRainImages(region)

  const existingImages = await retrieveLatestImagesFromStorage(
    `rain/${regionCode}`,
  )

  const imagesToAdd = determineImagesToAdd(newImages, existingImages)

  console.log(`${imagesToAdd.length} images to add`)
  if (imagesToAdd.length > 0) {
    await removeImagesFromStorage(existingImages, `rain/${regionCode}`)
  }

  const result = await uploadImagesToStorage(imagesToAdd)

  return NextResponse.json(result)
}
