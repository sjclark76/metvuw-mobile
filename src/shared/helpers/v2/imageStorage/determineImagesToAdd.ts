import { StorageImage } from '@/shared/helpers/imageStorage/storageImage'
import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'

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
