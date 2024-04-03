import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { StorageImage } from '@/shared/types/storageImage'

export async function removeImagesFromStorage(images: StorageImage[]) {
  const { error } = await serviceRoleDb.storage
    .from('images')
    .remove(images.map((image) => image.fullStoragePath))

  // eslint-disable-next-line no-console
  if (error) console.error(error)
}
