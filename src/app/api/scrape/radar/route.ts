import { NextResponse } from 'next/server'

import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { determineImagesToAdd } from '@/shared/helpers/imageStorage/determineImagesToAdd'
import { removeImagesFromStorage } from '@/shared/helpers/imageStorage/removeImagesFromStorage'
import { uploadImagesToStorage } from '@/shared/helpers/imageStorage/uploadImagesToStorage'
import { scrapeRadarImages } from '@/shared/helpers/screenScraper'
import { RadarChartData } from '@/shared/types/radarChartData'

export async function GET(): Promise<NextResponse<RadarChartData[]>> {
  const newImages = await scrapeRadarImages()

  const { data } = await serviceRoleDb.storage.from('images').list('radar', {
    limit: 200,
    offset: 0,
    search: '',
    sortBy: {
      column: 'name',
      order: 'asc',
    },
  })

  const existingImages = data ?? []

  const imagesToAdd = determineImagesToAdd(newImages, existingImages)

  if (imagesToAdd.length > 0) {
    await removeImagesFromStorage(existingImages, 'radar')
  }

  await uploadImagesToStorage(imagesToAdd)

  return NextResponse.json(newImages)
}
