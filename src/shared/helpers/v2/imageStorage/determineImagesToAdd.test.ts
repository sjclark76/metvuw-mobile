import { determineImagesToAdd } from '@/shared/helpers/v2/imageStorage/determineImagesToAdd'
import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'
import { StorageImage } from '@/shared/types/storageImage'

describe('determineImagesToAdd', () => {
  test('if image does not exist then should be added', () => {
    const newImages: ScrapedImage[] = [
      {
        originalFileName: 'image-to-add',
        originalImageURL: new URL('http://metvuw.com'),
        fullStoragePath: '',
        storagePath: '',
      },
    ]
    const existingImages: StorageImage[] = [{ name: 'existing-image' }]

    const toAdd = determineImagesToAdd(newImages, existingImages)

    expect(toAdd).toHaveLength(1)
  })

  test('if image does exist then should not be added', () => {
    const newImages: ScrapedImage[] = [
      {
        originalFileName: 'existing-image',
        originalImageURL: new URL('http://metvuw.com'),
        fullStoragePath: '',
        storagePath: '',
      },
    ]
    const existingImages: StorageImage[] = [{ name: 'existing-image' }]

    const toAdd = determineImagesToAdd(newImages, existingImages)

    expect(toAdd).toHaveLength(0)
  })
})
