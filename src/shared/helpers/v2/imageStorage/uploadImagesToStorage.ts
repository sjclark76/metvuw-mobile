import path from 'node:path'

import * as buffer from 'buffer'

import { config } from '@/config'
import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { downloadImageToBuffer } from '@/shared/helpers/v2/imageStorage/downloadImageToBuffer'
import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'

export async function uploadImagesToStorage(
  imagesToUpload: ScrapedImage[],
  // eslint-disable-next-line no-unused-vars
  transformer?: (i: buffer.Buffer) => Promise<buffer.Buffer>,
) {
  return Promise.all(
    imagesToUpload.map(async ({ originalImageURL, fullStoragePath }) => {
      const image = await downloadImageToBuffer(originalImageURL.href)

      const imageToUpload = transformer
        ? await transformer(image.fileBuffer)
        : image.fileBuffer

      const fileExtension = path.extname(fullStoragePath)
      return serviceRoleDb.storage
        .from(config.supbabaseBucketName)
        .upload(
          fullStoragePath.replace(fileExtension, '.webp'),
          imageToUpload,
          {
            contentType: 'image/webp',
          },
        )
    }),
  )
}
