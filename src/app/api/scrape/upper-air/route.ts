import { NextRequest, NextResponse } from 'next/server'

import { compressUpperAirImage } from '@/shared/helpers/v2/imageCompression/compressUpperAirImage'
import {
  determineImagesToAdd,
  removeImagesFromStorage,
  retrieveImagesFromStorage,
  uploadImagesToStorage,
} from '@/shared/helpers/v2/imageStorage'
import { scrapeUpperAirImages } from '@/shared/helpers/v2/screenScraper'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  const force = Boolean(_request.nextUrl.searchParams.get('force'))

  const newImages = await scrapeUpperAirImages()

  const existingImages = await retrieveImagesFromStorage('upper-air')

  const imagesToAdd = force
    ? newImages
    : determineImagesToAdd(newImages, existingImages)

  if (imagesToAdd.length > 0 || force) {
    await removeImagesFromStorage(existingImages)
  }

  const result = await uploadImagesToStorage(imagesToAdd, compressUpperAirImage)

  return NextResponse.json(result)
}
