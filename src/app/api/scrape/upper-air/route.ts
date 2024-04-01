import { NextResponse } from 'next/server'

import {
  determineImagesToAdd,
  removeImagesFromStorage,
  retrieveLatestImagesFromStorage,
  uploadImagesToStorage,
} from '@/shared/helpers/v2/imageStorage'
import { scrapeUpperAirImages } from '@/shared/helpers/v2/screenScraper'

export const dynamic = 'force-dynamic'

export async function GET() {
  const newImages = await scrapeUpperAirImages()

  const existingImages = await retrieveLatestImagesFromStorage('upper-air')

  const imagesToAdd = determineImagesToAdd(newImages, existingImages)

  if (imagesToAdd.length > 0) {
    await removeImagesFromStorage(existingImages, 'upper-air')
  }

  const result = await uploadImagesToStorage(imagesToAdd)

  return NextResponse.json(result)
}
