import { inngest } from '@/inngest/client'
import { removeImagesFromStorage } from '@/shared/helpers/v2/imageStorage/removeImagesFromStorage'

export const removeImages = inngest.createFunction(
  {
    id: 'remove-images',
    concurrency: { scope: 'account', limit: 10, key: 'metvuw' },
  },
  { event: 'images/remove' },
  async ({ event }) => {
    const { bucket, toRemove } = event.data

    if (toRemove.length === 0) {
      return { event, message: 'skipping' }
    }

    const result = await removeImagesFromStorage(bucket, toRemove)

    return { event, ...result }
  },
)
