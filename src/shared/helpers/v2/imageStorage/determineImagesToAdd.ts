import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'
import { StorageImage } from '@/shared/types/storageImage'

export const determineImagesToAdd = (
  newImages: ScrapedImage[],
  existingImages: StorageImage[],
): ScrapedImage[] =>
  newImages.every((newImage) =>
    existingImages.some(
      (existingImage) => existingImage.name === newImage.originalFileName,
    ),
  )
    ? []
    : newImages
