import path from 'node:path'

import serviceRoleDb from '@/shared/db/serviceRoleDb'

const OneYear = '31536000'
export function uploadImage(
  bucketId: string,
  fullStoragePath: string,
  imageToUpload: Buffer,
) {
  const fileExtension = path.extname(fullStoragePath)

  return serviceRoleDb.storage
    .from(bucketId)
    .upload(fullStoragePath.replace(fileExtension, '.webp'), imageToUpload, {
      contentType: 'image/webp',
      upsert: false,
      cacheControl: OneYear,
    })
}
