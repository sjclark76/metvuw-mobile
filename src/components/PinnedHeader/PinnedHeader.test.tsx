import { act, render, screen } from '@testing-library/react'

import { PinnedHeader } from './PinnedHeader'

// jsdom has no ResizeObserver, and lays nothing out. This one calls back when told
// the bar has changed size, and the bar is measured as that height.
let report: (height: number) => void = () => {}
let disconnected = false
class FakeResizeObserver {
  constructor(private callback: () => void) {
    report = (height) => {
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
        height,
      } as DOMRect)
      this.callback()
    }
  }
  observe() {}
  unobserve() {}
  disconnect() {
    disconnected = true
  }
}

const header = () => screen.getByRole('banner')
const spacer = () => header().nextElementSibling as HTMLElement

describe('<PinnedHeader />', () => {
  beforeEach(() => {
    disconnected = false
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  test('holds its children in a header', () => {
    render(
      <PinnedHeader>
        <nav>menu</nav>
      </PinnedHeader>,
    )

    expect(header()).toContainElement(screen.getByText('menu'))
  })

  // iOS moved a sticky bar a frame behind a big scroll jump, so it flashed. A
  // fixed bar is placed with the page's own layer instead.
  test('is fixed to the top of the screen, not sticky', () => {
    render(<PinnedHeader>x</PinnedHeader>)

    expect(header()).toHaveClass('fixed', 'inset-x-0', 'top-0')
    expect(header()).not.toHaveClass('sticky')
  })

  test('stays above the page content, as it did', () => {
    render(<PinnedHeader>x</PinnedHeader>)

    expect(header()).toHaveClass('z-30')
  })

  test('is left out of print, as it was', () => {
    render(<PinnedHeader>x</PinnedHeader>)

    expect(header()).toHaveClass('print:hidden')
    expect(spacer()).toHaveClass('print:hidden')
  })

  // A fixed bar takes no room, so the page needs a gap the size of the bar.
  describe('the gap that keeps the page below it', () => {
    test('is the height of the bar from the first paint: 4rem, its usual height', () => {
      render(<PinnedHeader>x</PinnedHeader>)

      expect(spacer()).toHaveClass('h-16')
      expect(spacer().style.height).toBe('')
    })

    test('is hidden from assistive technology: it is only space', () => {
      render(<PinnedHeader>x</PinnedHeader>)

      expect(spacer()).toHaveAttribute('aria-hidden', 'true')
    })

    test('follows the bar when it grows, as it does when the menu opens', () => {
      render(<PinnedHeader>x</PinnedHeader>)

      act(() => report(464))

      expect(spacer().style.height).toBe('464px')
    })

    test('and shrinks with it again', () => {
      render(<PinnedHeader>x</PinnedHeader>)
      act(() => report(464))

      act(() => report(64))

      expect(spacer().style.height).toBe('64px')
    })

    test('stops watching when the header goes', () => {
      const { unmount } = render(<PinnedHeader>x</PinnedHeader>)

      unmount()

      expect(disconnected).toBe(true)
    })

    test('copes where nothing can be watched', () => {
      vi.stubGlobal('ResizeObserver', undefined)

      render(<PinnedHeader>x</PinnedHeader>)

      expect(spacer()).toHaveClass('h-16')
    })
  })
})
