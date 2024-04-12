/* eslint-disable no-unused-vars */
import path from 'node:path'

import { config } from '@/config'
import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'

/**
 * Function to transform and generate paths for scraped images.
 *
 * @param {function} relativeUrlTransformer - A function that transforms the relative URL of an image.
 * @param {function} fullStoragePathGenerator - A function that generates the full storage path for the original and new image file.
 *
 * @returns {function} - Returns a function that takes an image object and returns an object with the original image URL, original file name, new file name, and full storage paths.
 */
export function imagePipeline(
  relativeUrlTransformer: (relativeUrl: string) => string,
  fullStoragePathGenerator: (
    originalFileName: string,
    newFileName: string,
  ) => Pick<ScrapedImage, 'fullStoragePath' | 'smallImageStoragePath'>,
) {
  return (image: { relativeUrl: string }) => {
    const transformedUrl = relativeUrlTransformer(image.relativeUrl)
    const originalImageURL = new URL(transformedUrl, config.metvuwBaseUrl)
    const originalFileName = path.basename(originalImageURL.pathname)
    const newFileName = originalFileName.replace(
      path.extname(originalFileName),
      '.webp',
    )

    return {
      originalImageURL: originalImageURL.href,
      originalFileName,
      imageFileName: newFileName,
      ...fullStoragePathGenerator(originalFileName, newFileName),
    }
  }
}
