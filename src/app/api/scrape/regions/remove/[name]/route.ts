import { NextRequest, NextResponse } from 'next/server'

import { config } from '@/config'
import {
  calculateImagesToRemove,
  retrieveImagesFromStorage,
} from '@/shared/helpers/v2/imageStorage'
import { removeImagesFromStorage } from '@/shared/helpers/v2/imageStorage/removeImagesFromStorage'
import { scrapeRainImages } from '@/shared/helpers/v2/screenScraper'
import { findRegionByCode } from '@/shared/types/region'

export async function POST(
  _request: NextRequest,
  props: { params: Promise<{ name: string }> },
) {
  const params = await props.params
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

  const toRemove = calculateImagesToRemove(newImages, existingImages)

  await removeImagesFromStorage(config.supbabaseBucketName, toRemove)

  return NextResponse.json({
    ok: true,

    toRemove: toRemove,
  })
}
