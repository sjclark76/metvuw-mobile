import { NextResponse } from 'next/server'

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

export async function GET() {
  const newImages = await scrapeUpperAirImages()
  const existingImages = await retrieveImagesFromStorage('images/upper-air')

  const toRemove = calculateImagesToRemove(newImages, existingImages)

  await addToImageRemovalQueue(toRemove)

  const toDownload = calculateImagesToDownload(newImages, existingImages)

  await addImagesToUploadQueue(toDownload, 'Upper Air')

  if (toRemove.length > 0) {
    await triggerJob('remove_images')
  } else {
    await triggerJob('upload_images')
  }

  return NextResponse.json({ ok: true })
}
