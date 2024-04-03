/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server'

import { compressRadarImage } from '@/shared/helpers/v2/imageCompression/compressRadarImage'
import {
  determineImagesToAdd,
  removeImagesFromStorage,
  retrieveImagesFromStorage,
  uploadImagesToStorage,
} from '@/shared/helpers/v2/imageStorage'
import { scrapeRadarImages } from '@/shared/helpers/v2/screenScraper'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  const force = Boolean(_request.nextUrl.searchParams.get('force'))

  const newImages = await scrapeRadarImages()
  console.log('scrapeRadarImages completed')
  const existingImages = await retrieveImagesFromStorage('images/radar')

  console.log('retrieveImagesFromStorage completed')

  const imagesToAdd = force
    ? newImages
    : determineImagesToAdd(newImages, existingImages)

  console.log('images to add', { imagesToAdd })

  if (imagesToAdd.length > 0 || force) {
    await removeImagesFromStorage(existingImages)
    console.log('removeImagesFromStorage completed')
  }

  const result = await uploadImagesToStorage(imagesToAdd, compressRadarImage)
  console.log('uploadImagesToStorage completed')

  return NextResponse.json(result)
}
