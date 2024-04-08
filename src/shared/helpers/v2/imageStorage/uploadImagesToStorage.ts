/* eslint-disable no-unused-vars */
// eslint-disable-next-line no-unused-vars
import path from 'node:path'

import * as buffer from 'buffer'

import { config } from '@/config'
import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { downloadImageToBuffer } from '@/shared/helpers/v2/imageStorage/downloadImageToBuffer'
import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'

export function uploadImage(
  bucketId: string,
  fullStoragePath: string,
  imageToUpload: Buffer,
) {
  const fileExtension = path.extname(fullStoragePath)

  return serviceRoleDb.storage
    .from(bucketId)
    .upload(fullStoragePath.replace(fileExtension, '.webp'), imageToUpload, {
      contentType: 'image/webp',
    })
}

export async function uploadImagesToStorage(
  imagesToUpload: ScrapedImage[],
  transformer?: (i: buffer.Buffer) => Promise<buffer.Buffer>,
  thumbnailTransformer?: (i: buffer.Buffer) => Promise<buffer.Buffer>,
) {
  return Promise.all(
    imagesToUpload.map(
      async ({ originalImageURL, fullStoragePath, smallImageStoragePath }) => {
        const image = await downloadImageToBuffer(originalImageURL.href)

        const imageToUpload = transformer
          ? await transformer(image.fileBuffer)
          : image.fileBuffer

        if (thumbnailTransformer && smallImageStoragePath) {
          const smallImage = await thumbnailTransformer(image.fileBuffer)
          await uploadImage(
            config.supbabaseBucketName,
            smallImageStoragePath,
            smallImage,
          )
        }
        return uploadImage(
          config.supbabaseBucketName,
          fullStoragePath,
          imageToUpload,
        )
      },
    ),
  )
}
