import { config } from '@/config'
import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { StorageImage } from '@/shared/types/storageImage'

export async function removeImagesFromStorage(images: StorageImage[]) {
  const imagePaths = images.map((image) => image.fullStoragePath)
  const { error } = await serviceRoleDb.storage
    .from(config.supbabaseBucketName)
    .remove(images.map((image) => image.fullStoragePath))

  // eslint-disable-next-line no-console
  if (error) console.error(error)

  await serviceRoleDb.storage.from('small-images').remove(imagePaths)
}
