/* eslint-disable no-console */
import { NextResponse } from 'next/server'

import {
  addImagesToUploadQueue,
  addToImageRemovalQueue,
  calculateImagesToDownload,
  calculateImagesToRemove,
  retrieveImagesFromStorage,
} from '@/shared/helpers/v2/imageStorage'
import { triggerJob } from '@/shared/helpers/v2/jobs'
import { scrapeRadarImages } from '@/shared/helpers/v2/screenScraper'

export const dynamic = 'force-dynamic'

export async function GET() {
  const newImages = await scrapeRadarImages()
  const existingImages = await retrieveImagesFromStorage('images/radar')

  const toRemove = calculateImagesToRemove(newImages, existingImages)

  console.table(toRemove)

  await addToImageRemovalQueue(toRemove)

  const toDownload = calculateImagesToDownload(newImages, existingImages)

  console.table(toDownload)

  await addImagesToUploadQueue(toDownload, 'Radar')

  if (toRemove.length > 0) {
    await triggerJob('remove_images')
  } else {
    await triggerJob('upload_images')
  }

  return NextResponse.json({ ok: true })
}
