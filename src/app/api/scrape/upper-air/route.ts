import { NextResponse } from 'next/server'

import { config } from '@/config'
import {
  addImagesToUploadQueue,
  addToImageRemovalQueue,
  calculateImagesToDownload,
  calculateImagesToRemove,
  retrieveImagesFromStorage,
} from '@/shared/helpers/v2/imageStorage'
import { triggerJob } from '@/shared/helpers/v2/jobs'
import { scrapeUpperAirImages } from '@/shared/helpers/v2/screenScraper'

export const dynamic = 'force-dynamic'

const triggerCode = `${config.supbabaseBucketName}-Upper-Air`

export async function GET() {
  const newImages = await scrapeUpperAirImages()
  const existingImages = await retrieveImagesFromStorage('images/upper-air')

  const toRemove = calculateImagesToRemove(newImages, existingImages)

  await addToImageRemovalQueue(toRemove, triggerCode)

  const toDownload = calculateImagesToDownload(newImages, existingImages)

  await addImagesToUploadQueue(toDownload, 'Upper Air', triggerCode)

  if (toRemove.length > 0) {
    await triggerJob('remove_images', triggerCode)
  } else {
    await triggerJob('upload_images', triggerCode)
  }

  return NextResponse.json({ ok: true })
}
