import { fireEvent, render } from '@testing-library/react'

import WeatherImage from './WeatherImage'

const markLoaded = vi.fn()
vi.mock('@/components/ImageProgress/ImageProgress', () => ({
  useMarkImageLoaded: () => markLoaded,
}))

const renderImage = (src: string | undefined = '/a.webp') =>
  render(
    <WeatherImage
      chartType="Rain"
      imageAlt="chart"
      imageSrc={src}
      isHighPriority={false}
    />,
  )

describe('WeatherImage progress reporting', () => {
  beforeEach(() => {
    markLoaded.mockClear()
  })

  test('reports the image once the browser has loaded it', () => {
    const { container } = renderImage()

    fireEvent.load(container.querySelector('img')!)

    expect(markLoaded).toHaveBeenCalledExactlyOnceWith('/a.webp')
  })

  test('reports nothing while the image is still loading', () => {
    renderImage()

    expect(markLoaded).not.toHaveBeenCalled()
  })

  test('reports an image that was already loaded when it mounted', () => {
    Object.defineProperty(HTMLImageElement.prototype, 'complete', {
      configurable: true,
      get: () => true,
    })

    renderImage('/cached.webp')

    expect(markLoaded).toHaveBeenCalledExactlyOnceWith('/cached.webp')
    Reflect.deleteProperty(HTMLImageElement.prototype, 'complete')
  })

  test('stops listening when it unmounts', () => {
    const { container, unmount } = renderImage()
    const image = container.querySelector('img')!

    unmount()
    fireEvent.load(image)

    expect(markLoaded).not.toHaveBeenCalled()
  })
})
