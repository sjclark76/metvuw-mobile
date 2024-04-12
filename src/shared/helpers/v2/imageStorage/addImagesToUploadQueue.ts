import { config } from '@/config'
import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'
import { ChartType } from '@/shared/types/ChartType'

export async function addImagesToUploadQueue(
  imagesToUpload: ScrapedImage[],
  chartType: ChartType,
  triggerKey: string,
) {
  const toInsert = imagesToUpload.map((img) => ({
    bucket_id: config.supbabaseBucketName,
    chart_type: chartType,
    full_storage_path: img.fullStoragePath,
    original_image_url: img.originalImageURL,
    small_image_storagePath: img.smallImageStoragePath,
    trigger_key: triggerKey,
  }))
  const { error } = await serviceRoleDb
    .from('images_to_upload')
    .insert(toInsert)
    .select()

  // eslint-disable-next-line no-console
  if (error) console.error('[addImagesToUploadQueue]', error)
}
