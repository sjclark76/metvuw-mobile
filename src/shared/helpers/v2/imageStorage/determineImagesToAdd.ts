import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'
import { StorageImage } from '@/shared/types/storageImage'

function isMatch(existing: StorageImage, newImage: ScrapedImage) {
  return existing.fullStoragePath === newImage.fullStoragePath
}

export const calculateImagesToDownload = (
  newImages: ScrapedImage[],
  existingImages: StorageImage[],
): ScrapedImage[] =>
  newImages.filter(
    (newImage) =>
      !existingImages.some((existing) => isMatch(existing, newImage)),
  )

export const calculateImagesToRemove = (
  newImages: ScrapedImage[],
  existingImages: StorageImage[],
): StorageImage[] =>
  existingImages.filter(
    (existing) => !newImages.some((newImage) => isMatch(existing, newImage)),
  )
