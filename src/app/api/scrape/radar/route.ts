/* eslint-disable no-console */
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
import { scrapeRadarImages } from '@/shared/helpers/v2/screenScraper'
import { ScrapeResult } from '@/shared/types/ScrapeResult'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse<ScrapeResult>> {
  const newImages = await scrapeRadarImages()
  const triggerKey = generateTriggerCode('Radar')
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

  return NextResponse.json({
    ok: true,
    toAdd: toDownload.map((img) => ({
      fullStoragePath: img.fullStoragePath,
      imageFileName: img.imageFileName,
    })),
    toRemove: toRemove,
  })
}
