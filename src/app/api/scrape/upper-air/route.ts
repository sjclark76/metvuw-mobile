import { NextResponse } from 'next/server'

import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { determineImagesToAdd } from '@/shared/helpers/imageStorage/determineImagesToAdd'
import { removeImagesFromStorage } from '@/shared/helpers/imageStorage/removeImagesFromStorage'
import { uploadImagesToStorage } from '@/shared/helpers/imageStorage/uploadImagesToStorage'
import { scrapeUpperAirImages } from '@/shared/helpers/screenScraper'
import { UpperAirChartData } from '@/shared/types/upperAirChartData'

export async function GET(): Promise<NextResponse<UpperAirChartData[]>> {
  const newImages = await scrapeUpperAirImages()

  const { data } = await serviceRoleDb.storage.from('images').list('upper-air')

  const existingImages = data ?? []

  const imagesToAdd = determineImagesToAdd(newImages, existingImages)

  if (imagesToAdd.length > 0) {
    await removeImagesFromStorage(existingImages, 'upper-air')
  }

  await uploadImagesToStorage(imagesToAdd)

  return NextResponse.json(newImages)
}
