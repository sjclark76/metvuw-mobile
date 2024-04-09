/* eslint-disable no-console */
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
import { scrapeRadarImages } from '@/shared/helpers/v2/screenScraper'

export const dynamic = 'force-dynamic'

const triggerKey = `${config.supbabaseBucketName}-Radar`
export async function GET() {
  const newImages = await scrapeRadarImages()
  const existingImages = await retrieveImagesFromStorage('images/radar')

  const toRemove = calculateImagesToRemove(newImages, existingImages)

  await addToImageRemovalQueue(toRemove, triggerKey)

  const toDownload = calculateImagesToDownload(newImages, existingImages)

  await addImagesToUploadQueue(toDownload, 'Radar', triggerKey)

  if (toRemove.length > 0) {
    await triggerJob('remove_images', triggerKey)
  } else {
    await triggerJob('upload_images', triggerKey)
  }

  return NextResponse.json({ ok: true })
}
