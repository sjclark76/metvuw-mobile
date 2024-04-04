import { NextRequest, NextResponse } from 'next/server'

import { compressSatelliteImage } from '@/shared/helpers/v2/imageCompression/compressSatelliteImage'
import {
  determineImagesToAdd,
  removeImagesFromStorage,
  retrieveImagesFromStorage,
  uploadImagesToStorage,
} from '@/shared/helpers/v2/imageStorage'
import { scrapeSatelliteImages } from '@/shared/helpers/v2/screenScraper/scrapeSatelliteImages'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  const force = Boolean(_request.nextUrl.searchParams.get('force'))

  const newImages = await scrapeSatelliteImages()

  const existingImages = await retrieveImagesFromStorage('images/satellite')

  const imagesToAdd = force
    ? newImages
    : determineImagesToAdd(newImages, existingImages)

  if (imagesToAdd.length > 0 || force) {
    await removeImagesFromStorage(existingImages)
  }

  const result = await uploadImagesToStorage(
    imagesToAdd,
    compressSatelliteImage,
  )

  return NextResponse.json(result)
}
