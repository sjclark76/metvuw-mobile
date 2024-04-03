import { determineImagesToAdd } from '@/shared/helpers/v2/imageStorage/determineImagesToAdd'
import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'
import { StorageImage } from '@/shared/types/storageImage'

describe('determineImagesToAdd', () => {
  test('if image does not exist then should be added', () => {
    const newImages: ScrapedImage[] = [
      {
        originalFileName: 'image-to-add',
        originalImageURL: new URL('https://metvuw.com'),
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

    const toAdd = determineImagesToAdd(newImages, existingImages)

    expect(toAdd).toHaveLength(1)
  })

  test('if image does exist then should not be added', () => {
    const newImages: ScrapedImage[] = [
      {
        originalFileName: 'existing-image',
        originalImageURL: new URL('https://metvuw.com'),
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

    const toAdd = determineImagesToAdd(newImages, existingImages)

    expect(toAdd).toHaveLength(0)
  })
})
