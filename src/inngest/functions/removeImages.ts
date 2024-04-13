import { inngest } from '@/inngest/client'
import serviceRoleDb from '@/shared/db/serviceRoleDb'

export const removeImages = inngest.createFunction(
  { id: 'remove-images', concurrency: { scope: 'account', limit: 20 } },
  { event: 'images/remove' },
  async ({ event }) => {
    const { bucket, toRemove } = event.data

    if (toRemove.length === 0) {
      return { event, message: 'skipping' }
    }
    const imagePaths = toRemove.map((img) => img.fullStoragePath)

    const { error, data } = await serviceRoleDb.storage
      .from(bucket)
      .remove(imagePaths)

    return { event, error, data }
  },
)
