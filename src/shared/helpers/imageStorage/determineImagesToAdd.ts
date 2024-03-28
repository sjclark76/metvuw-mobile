import { StorageImage } from '@/shared/helpers/imageStorage/storageImage'

export const determineImagesToAdd = <T extends StorageImage>(
  newImages: T[],
  existingImages: StorageImage[],
): T[] => {
  return newImages.every((newImage) =>
    existingImages.some(
      (existingImage) => existingImage.name === newImage.name,
    ),
  )
    ? []
    : newImages
}
