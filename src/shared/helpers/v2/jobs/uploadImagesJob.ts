/* eslint-disable no-console */
import { config } from '@/config'
import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { getCompressorForChart } from '@/shared/helpers/v2/imageCompression/getCompressorForChart'
import {
  downloadImageToBuffer,
  uploadImage,
} from '@/shared/helpers/v2/imageStorage'
import { markJobAsCompleted } from '@/shared/helpers/v2/jobs/triggerJob'
import { ChartType } from '@/shared/types/ChartType'

export async function uploadImagesJob(id: number, triggerKey: string) {
  const { data: images } = await serviceRoleDb
    .from('images_to_upload')
    .select('*')
    .eq('bucket_id', config.supbabaseBucketName)
    .eq('trigger_key', triggerKey)
    .select()

  if (images != null) {
    try {
      await Promise.all(
        images.map(
          async ({
            chart_type,
            original_image_url,
            full_storage_path,
            small_image_storagePath,
          }) => {
            const image = await downloadImageToBuffer(original_image_url)

            const { primary, small } = getCompressorForChart(
              chart_type as ChartType,
            )

            const imageToUpload = await primary(image.fileBuffer)

            if (small && small_image_storagePath) {
              const smallImage = await small(image.fileBuffer)
              await uploadImage(
                config.supbabaseBucketName,
                small_image_storagePath,
                smallImage,
              )
            }
            return uploadImage(
              config.supbabaseBucketName,
              full_storage_path,
              imageToUpload,
            )
          },
        ),
      )
    } catch (e) {
      console.error('error uploading image', e)
    } finally {
      const { error: deleteError } = await serviceRoleDb
        .from('images_to_upload')
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

      // await triggerJob('remove_images', triggerKey)
    }
  }
}
