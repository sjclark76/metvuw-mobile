import path from 'node:path'

import { config } from '@/config'
import { isAllowedSourceUrl } from '@/shared/helpers/dataSource/allowedSourceUrl'
import { ScrapedImage } from '@/shared/helpers/screenScraper/scrapedImage'

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
  ) =>
    Pick<ScrapedImage, 'fullStoragePath' | 'smallImageStoragePath'> | undefined,
) {
  return (image: { relativeUrl: string }): ScrapedImage | undefined => {
    const transformedUrl = relativeUrlTransformer(image.relativeUrl)
    const originalImageURL = new URL(transformedUrl, config.metvuwBaseUrl)
    // Scraped markup is untrusted: an absolute src must not point us elsewhere.
    if (!isAllowedSourceUrl(originalImageURL)) {
      throw new Error(`scraped image url not allowed: ${originalImageURL.href}`)
    }
    const originalFileName = path.basename(originalImageURL.pathname)
    const newFileName = originalFileName.replace(
      path.extname(originalFileName),
      '.webp',
    )

    // The generator returns undefined for a filename it doesn't recognise.
    const storagePaths = fullStoragePathGenerator(originalFileName, newFileName)
    if (!storagePaths) return undefined

    return {
      originalImageURL: originalImageURL.href,
      originalFileName,
      imageFileName: newFileName,
      ...storagePaths,
    }
  }
}
