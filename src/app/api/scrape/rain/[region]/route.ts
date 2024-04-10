import { NextRequest, NextResponse } from 'next/server'

import generateTriggerCode from '@/shared/helpers/generateTriggerCode'
import {
  addImagesToUploadQueue,
  addToImageRemovalQueue,
  calculateImagesToDownload,
  calculateImagesToRemove,
  retrieveImagesFromStorage,
} from '@/shared/helpers/v2/imageStorage'
import { triggerJob } from '@/shared/helpers/v2/jobs'
import { scrapeRainImages } from '@/shared/helpers/v2/screenScraper'
import { findRegionByCode } from '@/shared/types/region'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { region: string } },
) {
  const regionCode = params.region ?? 'nz'

  const region = findRegionByCode(regionCode)

  if (!region)
    return new NextResponse(`invalid region code: ${regionCode}`, {
      status: 404,
    })

  const triggerCode = generateTriggerCode(`Rain-${regionCode}`)

  const newImages = await scrapeRainImages(region)
  const existingImages = await retrieveImagesFromStorage(
    `images/rain/${regionCode}`,
  )

  const toRemove = calculateImagesToRemove(newImages, existingImages)

  await addToImageRemovalQueue(toRemove, triggerCode)

  const toDownload = calculateImagesToDownload(newImages, existingImages)

  await addImagesToUploadQueue(toDownload, 'Rain', triggerCode)

  if (toRemove.length > 0) {
    await triggerJob('remove_images', triggerCode)
  } else {
    await triggerJob('upload_images', triggerCode)
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
