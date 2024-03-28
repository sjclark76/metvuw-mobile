import { FileObject } from '@supabase/storage-js'

import serviceRoleDb from '@/shared/db/serviceRoleDb'

export async function removeImagesFromStorage(images: FileObject[]) {
  await serviceRoleDb.storage
    .from('satellite')
    .remove(images.map((image) => image.name))
}
