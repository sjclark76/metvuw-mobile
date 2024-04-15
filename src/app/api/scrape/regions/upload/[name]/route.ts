import { NextRequest, NextResponse } from 'next/server'

import { config } from '@/config'
import {
  calculateImagesToDownload,
  retrieveImagesFromStorage,
} from '@/shared/helpers/v2/imageStorage'
import { downloadAndUpload } from '@/shared/helpers/v2/imageStorage/downloadAndUpload'
import { scrapeRainImages } from '@/shared/helpers/v2/screenScraper'
import { findRegionByCode } from '@/shared/types/region'

export async function POST(
  _request: NextRequest,
  { params }: { params: { name: string } },
) {
  const regionCode = params.name ?? 'nz'

  const region = findRegionByCode(regionCode)

  if (!region)
    return new NextResponse(`invalid region code: ${regionCode}`, {
      status: 404,
    })

  const newImages = await scrapeRainImages(region)
  const existingImages = await retrieveImagesFromStorage(
    `images/rain/${regionCode}`,
  )

  const toDownload = calculateImagesToDownload(newImages, existingImages)

  await Promise.all(
    toDownload.map(async (image) =>
      downloadAndUpload(config.supbabaseBucketName, 'Rain', image),
    ),
  )

  return NextResponse.json({
    ok: true,
    toAdd: toDownload.map((img) => ({
      fullStoragePath: img.fullStoragePath,
      imageFileName: img.imageFileName,
    })),
  })
}
