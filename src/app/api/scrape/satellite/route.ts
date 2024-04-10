import { NextResponse } from 'next/server'

import generateTriggerCode from '@/shared/helpers/generateTriggerCode'
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

export async function GET() {
  const triggerKey = generateTriggerCode(`Satellite`)

  const newImages = await scrapeSatelliteImages()
  const existingImages = await retrieveImagesFromStorage('images/satellite')

  const toRemove = calculateImagesToRemove(newImages, existingImages)

  await addToImageRemovalQueue(toRemove, triggerKey)

  const toDownload = calculateImagesToDownload(newImages, existingImages)

  await addImagesToUploadQueue(toDownload, 'Satellite', triggerKey)

  if (toRemove.length > 0) {
    await triggerJob('remove_images', triggerKey)
  } else {
    await triggerJob('upload_images', triggerKey)
  }

  return NextResponse.json({
    ok: true,
    toAdd: toDownload.map((img) => ({
      fullStoragePath: img.fullStoragePath,
      imageFileName: img.imageFileName,
    })),
    toRemove: toRemove,
  })
}
