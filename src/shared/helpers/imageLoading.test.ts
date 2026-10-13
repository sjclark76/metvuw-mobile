import { EAGER_IMAGE_COUNT, imageLoadingFor } from './imageLoading'

describe('imageLoadingFor', () => {
  test('loads the first images eagerly and the rest lazily', () => {
    expect(EAGER_IMAGE_COUNT).toBe(2)
    expect(imageLoadingFor(0)).toBe('eager')
    expect(imageLoadingFor(1)).toBe('eager')
    expect(imageLoadingFor(2)).toBe('lazy')
    expect(imageLoadingFor(39)).toBe('lazy')
  })
})
