import { inngest } from '@/inngest/client'
import { downloadAndUpload } from '@/shared/helpers/v2/imageStorage/downloadAndUpload'

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
        images.map(async (image) =>
          downloadAndUpload(bucket, chartType, image),
        ),
      )
    }
    return { event }
  },
)
