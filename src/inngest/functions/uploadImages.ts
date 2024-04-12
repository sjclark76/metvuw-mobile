import { inngest } from '@/inngest/client'
import { getCompressorForChart } from '@/shared/helpers/v2/imageCompression/getCompressorForChart'
import {
  downloadImageToBuffer,
  uploadImage,
} from '@/shared/helpers/v2/imageStorage'

export const uploadImages = inngest.createFunction(
  { id: 'upload-images' },
  { event: 'images/upload' },
  async ({ event }) => {
    const { bucket, chartType, toUpload: images } = event.data
    if (images != null) {
      await Promise.all(
        images.map(
          async ({
            originalImageURL,
            fullStoragePath,
            smallImageStoragePath,
          }) => {
            const image = await downloadImageToBuffer(originalImageURL)

            const { primary, small } = getCompressorForChart(chartType)

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
