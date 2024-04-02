import { NextRequest, NextResponse } from 'next/server'

import {
  determineImagesToAdd,
  removeImagesFromStorage,
  retrieveLatestImagesFromStorage,
  uploadImagesToStorage,
} from '@/shared/helpers/v2/imageStorage'
import { scrapeSatelliteImages } from '@/shared/helpers/v2/screenScraper/scrapeSatelliteImages'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  const force = Boolean(_request.nextUrl.searchParams.get('force'))

  const newImages = await scrapeSatelliteImages()

  const existingImages = await retrieveLatestImagesFromStorage('satellite')

  const imagesToAdd = force
    ? newImages
    : determineImagesToAdd(newImages, existingImages)

  if (imagesToAdd.length > 0 || force) {
    await removeImagesFromStorage(existingImages, 'satellite')
  }

  const result = await uploadImagesToStorage(imagesToAdd)

  return NextResponse.json(result)
}
