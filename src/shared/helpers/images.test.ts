import { preloadImage } from './images'

describe('preloadImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('starts loading the url', () => {
    const created: { src: string }[] = []
    vi.stubGlobal(
      'Image',
      class {
        src = ''
        constructor() {
          created.push(this)
        }
      },
    )

    preloadImage('/api/fallback-image?url=a')

    expect(created).toHaveLength(1)
    expect(created[0].src).toBe('/api/fallback-image?url=a')
  })

  test('does nothing for an empty url', () => {
    const Image = vi.fn()
    vi.stubGlobal('Image', Image)

    preloadImage('')

    expect(Image).not.toHaveBeenCalled()
  })
})
