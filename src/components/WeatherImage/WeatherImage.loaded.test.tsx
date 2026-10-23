import { fireEvent, render } from '@testing-library/react'

import WeatherImage from './WeatherImage'

const markLoaded = vi.fn()
const state = vi.hoisted(() => ({ mayLoad: true }))
vi.mock('@/components/ImageProgress/ImageProgress', () => ({
  useMarkImageLoaded: () => markLoaded,
  useMayLoadImage: () => state.mayLoad,
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
    state.mayLoad = true
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

  // With no address a browser says the image is complete, though nothing has been
  // asked for: counting it would let every other chart start at once.
  test('does not report an image that is waiting for the first chart', () => {
    state.mayLoad = false
    Object.defineProperty(HTMLImageElement.prototype, 'complete', {
      configurable: true,
      get: () => true,
    })

    const { container } = renderImage('/waiting.webp')

    expect(container.querySelector('img')).not.toHaveAttribute('src')
    expect(markLoaded).not.toHaveBeenCalled()
    Reflect.deleteProperty(HTMLImageElement.prototype, 'complete')
  })

  test('gives an image its address once it may load', () => {
    state.mayLoad = true

    const { container } = renderImage('/ready.webp')

    expect(container.querySelector('img')).toHaveAttribute('src', '/ready.webp')
  })
})
