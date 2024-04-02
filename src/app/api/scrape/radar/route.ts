import { NextRequest, NextResponse } from 'next/server'

import { compressRadarImage } from '@/shared/helpers/v2/imageCompression/compressRadarImage'
import {
  determineImagesToAdd,
  removeImagesFromStorage,
  retrieveLatestImagesFromStorage,
  uploadImagesToStorage,
} from '@/shared/helpers/v2/imageStorage'
import { scrapeRadarImages } from '@/shared/helpers/v2/screenScraper'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  const force = Boolean(_request.nextUrl.searchParams.get('force'))

  const newImages = await scrapeRadarImages()

  const existingImages = await retrieveLatestImagesFromStorage('radar')

  const imagesToAdd = force
    ? newImages
    : determineImagesToAdd(newImages, existingImages)

  if (imagesToAdd.length > 0 || force) {
    await removeImagesFromStorage(existingImages, 'radar')
  }

  const result = await uploadImagesToStorage(imagesToAdd, compressRadarImage)

  return NextResponse.json(result)
}
