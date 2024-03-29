import { FileObject } from '@supabase/storage-js'

import serviceRoleDb from '@/shared/db/serviceRoleDb'

export async function removeImagesFromStorage(
  images: FileObject[],
  path: string,
) {
  console.log(`removing ${images.length} files from ${path}`, { images })
  const { error, data } = await serviceRoleDb.storage
    .from('images')
    .remove(images.map((image) => `${path}/${image.name}`))

  console.log('deletion result', { data, error })

  if (error) console.error(error)
}
