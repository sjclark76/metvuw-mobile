import { config } from '@/config'
import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { StorageImage } from '@/shared/types/storageImage'

export async function addToImageRemovalQueue(images: StorageImage[]) {
  const imagePaths = images.map((image) => image.fullStoragePath)

  for (const imagePath of imagePaths) {
    await serviceRoleDb.from('images_to_remove').upsert({
      full_storage_path: imagePath,
      bucket_id: config.supbabaseBucketName,
    })
  }
}
