import { NextResponse } from 'next/server'

import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { determineImagesToAdd } from '@/shared/helpers/imageStorage/determineImagesToAdd'
import { removeImagesFromStorage } from '@/shared/helpers/imageStorage/removeImagesFromStorage'
import { uploadImagesToStorage } from '@/shared/helpers/imageStorage/uploadImagesToStorage'
import { scrapeSatelliteImages } from '@/shared/helpers/screenScraper'
import { ChartData } from '@/shared/types/chartData'

export async function GET(): Promise<NextResponse<ChartData[]>> {
  const newImages = await scrapeSatelliteImages()

  const { data } = await serviceRoleDb.storage.from('satellite').list()

  const existingImages = data ?? []

  const imagesToAdd = determineImagesToAdd(newImages, existingImages)

  if (imagesToAdd.length > 0) {
    await removeImagesFromStorage(existingImages)
  }

  await uploadImagesToStorage(imagesToAdd)

  return NextResponse.json(newImages)
}
