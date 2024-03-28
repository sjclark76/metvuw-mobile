import { FileObject } from '@supabase/storage-js'

import serviceRoleDb from '@/shared/db/serviceRoleDb'

export async function removeImagesFromStorage(
  images: FileObject[],
  path: string,
) {
  const { error } = await serviceRoleDb.storage
    .from('images')
    .remove(images.map((image) => `${path}/${image.name}`))

  if (error) console.error(error)
}
