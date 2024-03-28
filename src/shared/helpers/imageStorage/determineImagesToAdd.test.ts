import { determineImagesToAdd } from '@/shared/helpers/imageStorage/determineImagesToAdd'
import { StorageImage } from '@/shared/helpers/imageStorage/imageStorage'

describe('determineImagesToAdd', () => {
  test('if image does not exist then should be added', () => {
    const newImages: StorageImage[] = [{ name: 'image-to-add' }]
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
    const newImages: StorageImage[] = [{ name: 'existing-image' }]
    const existingImages: StorageImage[] = [{ name: 'existing-image' }]

    const toAdd = determineImagesToAdd(newImages, existingImages)

    expect(toAdd).toHaveLength(0)
  })
})
