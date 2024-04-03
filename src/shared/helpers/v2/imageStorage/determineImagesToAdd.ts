import * as Path from 'path'

import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'
import { StorageImage } from '@/shared/types/storageImage'

export const determineImagesToAdd = (
  newImages: ScrapedImage[],
  existingImages: StorageImage[],
): ScrapedImage[] =>
  newImages.every((newImage) =>
    existingImages.some(
      (existingImage) =>
        Path.parse(existingImage.imageFileName).name ===
        Path.parse(newImage.originalFileName).name,
    ),
  )
    ? []
    : newImages
