import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { getCompressorForChart } from '@/shared/helpers/v2/imageCompression/getCompressorForChart'
import {
  downloadImageToBuffer,
  uploadImage,
} from '@/shared/helpers/v2/imageStorage'
import { ChartType } from '@/shared/types/ChartType'

import { inngest } from './client'
export const FunctionNames = {
  removeImages: 'remove-images',
  uploadImages: 'upload-images',
}

export const EventNames = {
  removeImages: 'images/remove',
  uploadImages: 'images/upload',
}

export const removeImages = inngest.createFunction(
  { id: FunctionNames.removeImages },
  { event: EventNames.removeImages },
  async ({ event }) => {
    const { bucket, toRemove } = event.data

    if (toRemove.length === 0) {
      return { event, message: 'skipping' }
    }
    const imagePaths = toRemove.map((img) => img.full_storage_path)

    const { error, data } = await serviceRoleDb.storage
      .from(bucket)
      .remove(imagePaths)

    return { event, error, data }
  },
)

export const uploadImages = inngest.createFunction(
  { id: FunctionNames.uploadImages },
  { event: EventNames.uploadImages },
  async ({ event }) => {
    const { bucket, toDownload: images } = event.data
    if (images != null) {
      await Promise.all(
        images.map(
          async ({
            originalImageURL,
            fullStoragePath,
            smallImageStoragePath,
          }) => {
            const image = await downloadImageToBuffer(originalImageURL)

            const { primary, small } = getCompressorForChart(
              'Radar' as ChartType,
            )

            const imageToUpload = await primary(image.fileBuffer)

            if (small && smallImageStoragePath) {
              const smallImage = await small(image.fileBuffer)
              await uploadImage(bucket, smallImageStoragePath, smallImage)
            }
            return uploadImage(bucket, fullStoragePath, imageToUpload)
          },
        ),
      )
    }
    return { event }
  },
)
