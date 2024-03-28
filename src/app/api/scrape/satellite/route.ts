import { NextResponse } from 'next/server'

import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { determineImagesToAdd } from '@/shared/helpers/v2/imageStorage/determineImagesToAdd'
import { removeImagesFromStorage } from '@/shared/helpers/v2/imageStorage/removeImagesFromStorage'
import { uploadImagesToStorage } from '@/shared/helpers/v2/imageStorage/uploadImagesToStorage'
import { scrapeSatelliteImages } from '@/shared/helpers/v2/screenScraper/scrapeSatelliteImages'

export async function GET() {
  const newImages = await scrapeSatelliteImages()

  const { data } = await serviceRoleDb.storage.from('images').list('satellite')

  const existingImages = data ?? []

  const imagesToAdd = determineImagesToAdd(newImages, existingImages)

  if (imagesToAdd.length > 0) {
    await removeImagesFromStorage(existingImages, 'satellite')
  }

  const result = await uploadImagesToStorage(imagesToAdd, 'satellite')

  return NextResponse.json(result)
}
