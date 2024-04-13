import { inngest } from '@/inngest/client'
import { getCompressorForChart } from '@/shared/helpers/v2/imageCompression/getCompressorForChart'
import {
  downloadImageToBuffer,
  uploadImage,
} from '@/shared/helpers/v2/imageStorage'

export const uploadImages = inngest.createFunction(
  {
    id: 'upload-images',
    concurrency: { scope: 'account', limit: 10, key: 'metvuw' },
  },
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

export const uploadImageFunc = inngest.createFunction(
  {
    id: 'upload-image',
    concurrency: { scope: 'account', limit: 10, key: 'metvuw' },
  },
  { event: 'image/upload' },
  async ({ event }) => {
    const { bucket, chartType, toUpload } = event.data
    const { originalImageURL, smallImageStoragePath, fullStoragePath } =
      toUpload

    const image = await downloadImageToBuffer(originalImageURL)

    const { primary, small } = getCompressorForChart(chartType)

    const imageToUpload = await primary(image.fileBuffer)

    await uploadImage(bucket, fullStoragePath, imageToUpload)

    if (small && smallImageStoragePath) {
      const smallImage = await small(image.fileBuffer)
      await uploadImage(bucket, smallImageStoragePath, smallImage)
    }

    return { event }
  },
)
