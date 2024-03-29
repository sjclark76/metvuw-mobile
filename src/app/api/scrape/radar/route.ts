import { NextResponse } from 'next/server'

import {
  determineImagesToAdd,
  removeImagesFromStorage,
  retrieveLatestImagesFromStorage,
  uploadImagesToStorage,
} from '@/shared/helpers/v2/imageStorage'
import { scrapeRadarImages } from '@/shared/helpers/v2/screenScraper'

export const dynamic = 'force-dynamic'

export async function GET() {
  const newImages = await scrapeRadarImages()

  const existingImages = await retrieveLatestImagesFromStorage('radar')

  console.table(existingImages)
  const imagesToAdd = determineImagesToAdd(newImages, existingImages)

  if (imagesToAdd.length > 0) {
    await removeImagesFromStorage(existingImages, 'radar')
  }

  const result = await uploadImagesToStorage(imagesToAdd)

  return NextResponse.json(result)
}
