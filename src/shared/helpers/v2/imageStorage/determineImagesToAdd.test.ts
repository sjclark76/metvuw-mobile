import {
  calculateImagesToDownload,
  calculateImagesToRemove,
} from '@/shared/helpers/v2/imageStorage/determineImagesToAdd'
import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'
import { StorageImage } from '@/shared/types/storageImage'

describe('calculateImagesToDownload', () => {
  test('if image does not exist then should be added', () => {
    const newImages: ScrapedImage[] = [
      {
        originalFileName: 'image-to-add',
        originalImageURL: new URL('https://metvuw.com').href,
        fullStoragePath: 'satellite/image-to-add.webp',
        imageFileName: 'image-to-add.webp',
      },
    ]
    const existingImages: StorageImage[] = [
      {
        imageFileName: 'existing-image.webp',
        fullStoragePath: 'satellite/existing-image.webp',
      },
    ]

    const toAdd = calculateImagesToDownload(newImages, existingImages)

    expect(toAdd).toHaveLength(1)
  })

  test('if image does exist then should not be added', () => {
    const newImages: ScrapedImage[] = [
      {
        originalFileName: 'existing-image',
        originalImageURL: new URL('https://metvuw.com').href,
        fullStoragePath: 'satellite/existing-image.webp',
        imageFileName: 'existing-image.webp',
      },
    ]
    const existingImages: StorageImage[] = [
      {
        imageFileName: 'existing-image.webp',
        fullStoragePath: 'satellite/existing-image.webp',
      },
    ]

    const toAdd = calculateImagesToDownload(newImages, existingImages)

    expect(toAdd).toHaveLength(0)
  })
})

describe('calculateImagesToRemove', () => {
  test('if image does not exist then should be removed', () => {
    const newImages: ScrapedImage[] = [
      {
        originalFileName: 'image-to-add',
        originalImageURL: new URL('https://metvuw.com').href,
        fullStoragePath: 'satellite/image-to-add.webp',
        imageFileName: 'image-to-add.webp',
      },
    ]
    const existingImages: StorageImage[] = [
      {
        imageFileName: 'existing-image.webp',
        fullStoragePath: 'satellite/existing-image.webp',
      },
    ]

    const toAdd = calculateImagesToRemove(newImages, existingImages)

    expect(toAdd).toHaveLength(1)
  })

  test('if image does exist then should not be removed', () => {
    const newImages: ScrapedImage[] = [
      {
        originalFileName: 'existing-image',
        originalImageURL: new URL('https://metvuw.com').href,
        fullStoragePath: 'satellite/existing-image.webp',
        imageFileName: 'existing-image.webp',
      },
    ]
    const existingImages: StorageImage[] = [
      {
        imageFileName: 'existing-image.webp',
        fullStoragePath: 'satellite/existing-image.webp',
      },
    ]

    const toAdd = calculateImagesToRemove(newImages, existingImages)

    expect(toAdd).toHaveLength(0)
  })
})
