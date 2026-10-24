import { act, fireEvent, render, screen } from '@testing-library/react'

import { PageTopEnd } from './PageTopEnd'
import { useFooterShown } from './useFooterShown'

const root = document.documentElement

// jsdom has no IntersectionObserver and lays nothing out. This one is told what
// the mark looks like, and calls back with it.
let report: (entry: Partial<IntersectionObserverEntry>) => void = () => {}
let options: { rootMargin?: string } | undefined
let disconnected = false
class FakeIntersectionObserver {
  constructor(
    callback: (entries: IntersectionObserverEntry[]) => void,
    init?: { rootMargin?: string },
  ) {
    options = init
    report = (entry) => callback([entry as IntersectionObserverEntry])
  }
  observe() {}
  disconnect() {
    disconnected = true
  }
}

const inView = {
  isIntersecting: true,
  boundingClientRect: { top: 100 } as DOMRect,
}
const below = {
  isIntersecting: false,
  boundingClientRect: { top: 900 } as DOMRect,
}
const scrolledOff = {
  isIntersecting: false,
  boundingClientRect: { top: -40 } as DOMRect,
}

function Page({
  viewerOpen = false,
  withMark = true,
}: {
  viewerOpen?: boolean
  withMark?: boolean
}) {
  useFooterShown({ viewerOpen })
  return (
    <>
      {withMark && <PageTopEnd />}
      <footer data-footer>
        <button type="button">In the footer</button>
      </footer>
      <button type="button">On the page</button>
    </>
  )
}

describe('useFooterShown', () => {
  beforeEach(() => {
    disconnected = false
    root.removeAttribute('data-footer-shown')
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
  })
  afterEach(() => vi.unstubAllGlobals())

  test('does not want the footer while the top of the page is showing', () => {
    render(<Page />)

    act(() => report(inView))

    expect(root).not.toHaveAttribute('data-footer-shown')
  })

  test('does not want it while the top of the page is below the screen', () => {
    render(<Page />)

    act(() => report(below))

    expect(root).not.toHaveAttribute('data-footer-shown')
  })

  test('wants it once the top of the page has scrolled off, and not again when it is back', () => {
    render(<Page />)

    act(() => report(scrolledOff))
    expect(root).toHaveAttribute('data-footer-shown')

    act(() => report(inView))
    expect(root).not.toHaveAttribute('data-footer-shown')
  })

  test('counts the top as gone when it is under the bar across the top', () => {
    render(<Page />)

    expect(options?.rootMargin).toBe('-64px 0px 0px 0px')
  })

  test('wants it whenever the animated viewer is open', () => {
    render(<Page viewerOpen />)

    expect(root).toHaveAttribute('data-footer-shown')
  })

  test('wants it on a page with no top to scroll off', () => {
    render(<Page withMark={false} />)

    expect(root).toHaveAttribute('data-footer-shown')
  })

  test('wants it where it cannot tell', () => {
    vi.stubGlobal('IntersectionObserver', undefined)

    render(<Page />)

    expect(root).toHaveAttribute('data-footer-shown')
  })

  test('lets go of the page when it goes', () => {
    const { unmount } = render(<Page viewerOpen />)

    unmount()

    expect(root).not.toHaveAttribute('data-footer-shown')
  })

  test('stops watching when it goes', () => {
    const { unmount } = render(<Page />)

    unmount()

    expect(disconnected).toBe(true)
  })

  describe('while the footer is being used', () => {
    const useFooterThenReturnToTop = () => {
      render(<Page />)
      act(() => report(scrolledOff))
      fireEvent.pointerDown(screen.getByText('In the footer'))
      act(() => report(inView))
    }

    test('stays when the page is taken back to the top from under it', () => {
      useFooterThenReturnToTop()

      expect(root).toHaveAttribute('data-footer-shown')
    })

    test('goes when the visitor takes hold of the page, if its top is showing', () => {
      useFooterThenReturnToTop()

      fireEvent.touchStart(screen.getByText('On the page'))

      expect(root).not.toHaveAttribute('data-footer-shown')
    })

    test('stays when the visitor takes hold of the page and its top has gone', () => {
      render(<Page />)
      act(() => report(scrolledOff))
      fireEvent.pointerDown(screen.getByText('In the footer'))

      fireEvent.wheel(screen.getByText('On the page'))

      expect(root).toHaveAttribute('data-footer-shown')
    })

    test('is not let go by a touch on the footer itself', () => {
      useFooterThenReturnToTop()

      fireEvent.touchStart(screen.getByText('In the footer'))

      expect(root).toHaveAttribute('data-footer-shown')
    })
  })
})
