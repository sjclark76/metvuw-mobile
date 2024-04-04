import { FileObject } from '@supabase/storage-js'

import { config } from '@/config'
import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { defaultSearchOptions } from '@/shared/helpers/v2/imageStorage/defaults'
import { StorageImage } from '@/shared/types/storageImage'

/**
 * Checks if a given file object represents a directory.
 * @param {FileObject} file - The file object to check.
 * @returns {boolean} True if the file object represents a directory, false otherwise.
 */
function isDirectory(file: FileObject): boolean {
  return file.id === null
}

/**
 * Recursively retrieves all images from a given path in storage.
 * If a directory is encountered, the function is called recursively with the new path.
 * @param {string} path - The path to retrieve images from.
 * @returns {Promise<FileObject[]>} A promise that resolves to an array of FileObjects representing the images.
 */
export async function retrieveImagesFromStorage(
  path: string,
): Promise<StorageImage[]> {
  // Retrieve the list of files (or directories) from the given path
  const { data } = await serviceRoleDb.storage
    .from(config.supbabaseBucketName)
    .list(path, defaultSearchOptions)

  const files = data ?? []

  // For each file, if it's a directory, recursively retrieve the images from the new path.
  // If it's a file, add it to the result array.
  const result = await Promise.all(
    files.flatMap(async (file) => {
      if (isDirectory(file)) {
        const newPath = `${path}/${file.name}`
        return retrieveImagesFromStorage(newPath)
      } else {
        const storageImage: StorageImage = {
          fullStoragePath: `${path}/${file.name}`,
          imageFileName: file.name,
        }
        return [storageImage]
      }
    }),
  )

  // Flatten the result array and return it
  return result.flat()
}
