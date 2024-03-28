import { StorageImage } from '@/shared/helpers/imageStorage/storageImage'
import { ChartData } from '@/shared/types/chartData'

export const determineImagesToAdd = (
  newImages: ChartData[],
  existingImages: StorageImage[],
): ChartData[] => {
  return newImages.every((newImage) =>
    existingImages.some(
      (existingImage) => existingImage.name === newImage.name,
    ),
  )
    ? []
    : newImages
}
