import { NextResponse } from 'next/server'

import {
  addImagesToUploadQueue,
  addToImageRemovalQueue,
  calculateImagesToDownload,
  calculateImagesToRemove,
  retrieveImagesFromStorage,
} from '@/shared/helpers/v2/imageStorage'
import { triggerJob } from '@/shared/helpers/v2/jobs'
import { scrapeSatelliteImages } from '@/shared/helpers/v2/screenScraper/scrapeSatelliteImages'

export const dynamic = 'force-dynamic'

const triggerCode = 'Satelllite'
export async function GET() {
  const newImages = await scrapeSatelliteImages()
  const existingImages = await retrieveImagesFromStorage('images/satellite')

  const toRemove = calculateImagesToRemove(newImages, existingImages)

  await addToImageRemovalQueue(toRemove, triggerCode)

  const toDownload = calculateImagesToDownload(newImages, existingImages)

  await addImagesToUploadQueue(toDownload, 'Satellite', triggerCode)

  if (toRemove.length > 0) {
    await triggerJob('remove_images', triggerCode)
  } else {
    await triggerJob('upload_images', triggerCode)
  }

  return NextResponse.json({ ok: true })
}
