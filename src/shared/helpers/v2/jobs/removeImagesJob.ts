/* eslint-disable no-console */
import { config } from '@/config'
import serviceRoleDb from '@/shared/db/serviceRoleDb'
import {
  markJobAsCompleted,
  triggerJob,
} from '@/shared/helpers/v2/jobs/triggerJob'

export async function removeImagesJob(id: number) {
  const { data: images } = await serviceRoleDb
    .from('images_to_remove')
    .select('*')
    .eq('bucket_id', config.supbabaseBucketName)
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

    if (deleteError) {
      console.error(deleteError)
    }

    const { error: updateJobError } = await markJobAsCompleted(id)

    if (updateJobError) {
      console.error(updateJobError)
    }

    await triggerJob('upload_images')
  }
}
