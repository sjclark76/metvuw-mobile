import { StorageImage } from '@/shared/helpers/imageStorage/storageImage'
import { determineImagesToAdd } from '@/shared/helpers/v2/imageStorage/determineImagesToAdd'
import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'

describe('determineImagesToAdd', () => {
  test('if image does not exist then should be added', () => {
    const newImages: ScrapedImage[] = [
      {
        originalFileName: 'image-to-add',
        originalImageURL: new URL('google.com'),
        width: 100,
        height: 100,
      },
    ]
    const existingImages: StorageImage[] = [{ name: 'existing-image' }]

    const toAdd = determineImagesToAdd(newImages, existingImages)

    expect(toAdd).toHaveLength(1)

    expect(toAdd).toMatchObject([
      {
        name: 'image-to-add',
      },
    ])
  })

  test('if image does exist then should not be added', () => {
    const newImages: ScrapedImage[] = [
      {
        originalFileName: 'existing-image',
        originalImageURL: new URL('google.com'),
        width: 100,
        height: 100,
      },
    ]
    const existingImages: StorageImage[] = [{ name: 'existing-image' }]

    const toAdd = determineImagesToAdd(newImages, existingImages)

    expect(toAdd).toHaveLength(0)
  })
})
