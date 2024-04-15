import { NextResponse } from 'next/server'

import { config } from '@/config'
import {
  calculateImagesToDownload,
  calculateImagesToRemove,
  retrieveImagesFromStorage,
} from '@/shared/helpers/v2/imageStorage'
import { downloadAndUpload } from '@/shared/helpers/v2/imageStorage/downloadAndUpload'
import { removeImagesFromStorage } from '@/shared/helpers/v2/imageStorage/removeImagesFromStorage'
import { scrapeRadarImages } from '@/shared/helpers/v2/screenScraper'

export async function POST() {
  const newImages = await scrapeRadarImages()

  const existingImages = await retrieveImagesFromStorage('images/radar')

  const toRemove = calculateImagesToRemove(newImages, existingImages)

  const toDownload = calculateImagesToDownload(newImages, existingImages)

  await removeImagesFromStorage(config.supbabaseBucketName, toRemove)

  await Promise.all(
    toDownload.map(async (image) =>
      downloadAndUpload(config.supbabaseBucketName, 'Radar', image),
    ),
  )

  return NextResponse.json({
    ok: true,
    toAdd: toDownload.map((img) => ({
      fullStoragePath: img.fullStoragePath,
      imageFileName: img.imageFileName,
    })),
    toRemove: toRemove,
  })
}
