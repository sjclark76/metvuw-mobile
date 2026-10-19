import { act, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'

import { useElementWidth } from './useElementWidth'

let resize: (() => void) | undefined
let disconnected = 0

function Box({ fallback }: { fallback?: number }) {
  const [ref, width] = useElementWidth<HTMLDivElement>(fallback)
  return (
    <div ref={ref} data-testid="box">
      {String(width)}
    </div>
  )
}

describe('useElementWidth', () => {
  beforeEach(() => {
    disconnected = 0
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resize = callback
        }
        observe(element: Element) {
          Object.defineProperty(element, 'clientWidth', {
            configurable: true,
            writable: true,
            value: 320,
          })
        }
        disconnect() {
          disconnected++
        }
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('reports the width the element has once it is on the page', () => {
    render(<Box />)
    act(() => resize?.())

    expect(screen.getByTestId('box')).toHaveTextContent('320')
  })

  test('reports the new width when the element is resized', () => {
    render(<Box />)
    act(() => resize?.())

    Object.defineProperty(screen.getByTestId('box'), 'clientWidth', {
      configurable: true,
      value: 640,
    })
    act(() => resize?.())

    expect(screen.getByTestId('box')).toHaveTextContent('640')
  })

  // The markup rendered ahead of time has no element to measure yet, so it must
  // come out with the fallback, and the browser then corrects it.
  test('starts from a fallback before it can measure', () => {
    expect(renderToString(<Box fallback={300} />)).toContain('300')
  })

  test('stops watching when the element goes away', () => {
    const { unmount } = render(<Box />)

    unmount()

    expect(disconnected).toBeGreaterThan(0)
  })

  test('keeps the fallback where the browser cannot watch for resizes', () => {
    vi.stubGlobal('ResizeObserver', undefined)

    render(<Box fallback={300} />)

    expect(screen.getByTestId('box')).toHaveTextContent('300')
  })
})
