import { FileObject, StorageError } from '@supabase/storage-js'

import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { StorageImage } from '@/shared/types/storageImage'

export async function removeImagesFromStorage(
  bucketName: string,
  toRemove: StorageImage[],
): Promise<
  { data: FileObject[]; error: null } | { data: null; error: StorageError }
> {
  if (toRemove.length === 0) {
    return { data: [], error: null }
  }

  const imagePaths = toRemove.map((img) => img.fullStoragePath)

  const result = await serviceRoleDb.storage.from(bucketName).remove(imagePaths)

  return result
}
