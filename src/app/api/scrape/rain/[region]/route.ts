import { NextRequest, NextResponse } from 'next/server'

import compressRainImage from '@/shared/helpers/v2/imageCompression/compressRainImage'
import {
  determineImagesToAdd,
  removeImagesFromStorage,
  retrieveLatestImagesFromStorage,
  uploadImagesToStorage,
} from '@/shared/helpers/v2/imageStorage'
import { scrapeRainImages } from '@/shared/helpers/v2/screenScraper'
import { findRegionByCode } from '@/shared/types/region'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { region: string } },
) {
  const force = Boolean(_request.nextUrl.searchParams.get('force'))

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

  const imagesToAdd = force
    ? newImages
    : determineImagesToAdd(newImages, existingImages)

  if (imagesToAdd.length > 0 || force) {
    await removeImagesFromStorage(existingImages, `rain/${regionCode}`)
  }

  const result = await uploadImagesToStorage(imagesToAdd, compressRainImage)

  return NextResponse.json(result)
}
