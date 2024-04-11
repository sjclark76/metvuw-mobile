/* eslint-disable no-console */
import { config } from '@/config'
import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { markJobAsCompleted } from '@/shared/helpers/v2/jobs/triggerJob'

export async function removeImagesJob(id: number, triggerKey: string) {
  const { data: images } = await serviceRoleDb
    .from('images_to_remove')
    .select('*')
    .eq('bucket_id', config.supbabaseBucketName)
    .eq('trigger_key', triggerKey)
    .select()

  if (images != null) {
    const imagePaths = images.map((img) => img.full_storage_path)

    const { error } = await serviceRoleDb.storage
      .from(config.supbabaseBucketName)
      .remove(imagePaths)

    if (error) {
      console.error(error)
    }

    const { error: deleteError } = await serviceRoleDb
      .from('images_to_remove')
      .delete()
      .eq('bucket_id', config.supbabaseBucketName)
      .eq('trigger_key', triggerKey)

    if (deleteError) {
      console.error(deleteError)
    }

    const { error: updateJobError } = await markJobAsCompleted(id)

    if (updateJobError) {
      console.error(updateJobError)
    }
  }
}

export async function removeImage(number: number) {
  const { data: images } = await serviceRoleDb
    .from('images_to_remove')
    .select('*')
    .eq('bucket_id', config.supbabaseBucketName)
    .select()
    .limit(number)

  if (images != null) {
    const imagePaths = images.map((img) => img.full_storage_path)

    const { error } = await serviceRoleDb.storage
      .from(config.supbabaseBucketName)
      .remove(imagePaths)

    if (error) {
      console.error(error)
    }

    const imageKeys = images.map((img) => img.trigger_key)
    const { error: deleteError } = await serviceRoleDb
      .from('images_to_remove')
      .delete()
      .eq('bucket_id', config.supbabaseBucketName)
      .eq('trigger_key', imageKeys)

    if (deleteError) {
      console.error(deleteError)
    }

    return images.length
  }
}
