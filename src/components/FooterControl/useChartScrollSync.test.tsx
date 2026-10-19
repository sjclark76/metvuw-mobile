import { act, render, renderHook } from '@testing-library/react'

import { useChartScrollSync } from './useChartScrollSync'

type ObserverOptions = { rootMargin?: string; threshold?: number[] }
type Entry = {
  target: Element
  isIntersecting: boolean
  intersectionRatio: number
}
let observers: {
  callback: (entries: Entry[]) => void
  options?: ObserverOptions
  observed: Element[]
  disconnect: ReturnType<typeof vi.fn>
}[] = []

class FakeIntersectionObserver {
  record
  constructor(callback: (entries: Entry[]) => void, options?: ObserverOptions) {
    this.record = {
      callback,
      options,
      observed: [] as Element[],
      disconnect: vi.fn(),
    }
    observers.push(this.record)
  }
  observe(element: Element) {
    this.record.observed.push(element)
  }
  disconnect() {
    this.record.disconnect()
  }
  unobserve() {}
}

const scrollIntoView = vi.fn()

function Charts({ count }: { count: number }) {
  return (
    <ul>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} data-chart-index={i} data-testid={`chart-${i}`} />
      ))}
    </ul>
  )
}

const chartsInPage = (count = 5) => render(<Charts count={count} />)
const see = (index: number, ratio = 1) => ({
  target: document.querySelector(`[data-chart-index="${index}"]`)!,
  isIntersecting: true,
  intersectionRatio: ratio,
})

describe('useChartScrollSync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    observers = []
    scrollIntoView.mockClear()
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
    Element.prototype.scrollIntoView = scrollIntoView
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  describe('following the page', () => {
    test('reports the chart that comes into view', () => {
      chartsInPage()
      const onIndex = vi.fn()
      renderHook(() => useChartScrollSync({ enabled: true, index: 0, onIndex }))
      act(() => vi.advanceTimersByTime(50))

      act(() => observers[0].callback([see(3)]))

      expect(onIndex).toHaveBeenCalledExactlyOnceWith(3)
    })

    test('watches every chart in the list', () => {
      chartsInPage(5)
      renderHook(() =>
        useChartScrollSync({ enabled: true, index: 0, onIndex: vi.fn() }),
      )
      act(() => vi.advanceTimersByTime(50))

      expect(observers[0].observed).toHaveLength(5)
    })

    test('prefers the chart that is most in view', () => {
      chartsInPage()
      const onIndex = vi.fn()
      renderHook(() => useChartScrollSync({ enabled: true, index: 0, onIndex }))
      act(() => vi.advanceTimersByTime(50))

      act(() => observers[0].callback([see(1, 0.2), see(2, 0.9), see(3, 0.4)]))

      expect(onIndex).toHaveBeenCalledExactlyOnceWith(2)
    })

    test('ignores charts leaving view', () => {
      chartsInPage()
      const onIndex = vi.fn()
      renderHook(() => useChartScrollSync({ enabled: true, index: 0, onIndex }))
      act(() => vi.advanceTimersByTime(50))

      act(() => observers[0].callback([{ ...see(2), isIntersecting: false }]))

      expect(onIndex).not.toHaveBeenCalled()
    })

    // The viewer shows its own chart, so the list is not on the page and there
    // is nothing to follow.
    test('does nothing, rather than failing, where the browser cannot watch', () => {
      vi.stubGlobal('IntersectionObserver', undefined)
      chartsInPage()

      expect(() => {
        renderHook(() =>
          useChartScrollSync({ enabled: true, index: 0, onIndex: vi.fn() }),
        )
        act(() => vi.advanceTimersByTime(50))
      }).not.toThrow()
    })

    test('does not watch while the viewer is open', () => {
      chartsInPage()
      renderHook(() =>
        useChartScrollSync({ enabled: false, index: 0, onIndex: vi.fn() }),
      )
      act(() => vi.advanceTimersByTime(50))

      expect(observers).toHaveLength(0)
    })

    test('stops watching when it is turned off or unmounted', () => {
      chartsInPage()
      const { rerender, unmount } = renderHook(
        ({ enabled }) =>
          useChartScrollSync({ enabled, index: 0, onIndex: vi.fn() }),
        { initialProps: { enabled: true } },
      )
      act(() => vi.advanceTimersByTime(50))

      rerender({ enabled: false })
      expect(observers[0].disconnect).toHaveBeenCalled()

      rerender({ enabled: true })
      act(() => vi.advanceTimersByTime(50))
      unmount()
      expect(observers.at(-1)!.disconnect).toHaveBeenCalled()
    })
  })

  describe('scrolling to a chart', () => {
    test('brings the chart to the top of the page', () => {
      chartsInPage()
      const { result } = renderHook(() =>
        useChartScrollSync({ enabled: true, index: 0, onIndex: vi.fn() }),
      )

      act(() => result.current.scrollToChart(3))

      expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({
        block: 'start',
        behavior: 'smooth',
      })
      expect(scrollIntoView.mock.contexts[0]).toBe(
        document.querySelector('[data-chart-index="3"]'),
      )
    })

    // A drag asks for a new chart many times a second. Gliding to each in turn
    // is sluggish and never catches up, so a quick succession jumps.
    test('jumps, rather than glides, while the visitor is dragging', () => {
      chartsInPage()
      const { result } = renderHook(() =>
        useChartScrollSync({ enabled: true, index: 0, onIndex: vi.fn() }),
      )

      act(() => result.current.scrollToChart(1))
      act(() => vi.advanceTimersByTime(60))
      act(() => result.current.scrollToChart(2))
      act(() => vi.advanceTimersByTime(60))
      act(() => result.current.scrollToChart(3))

      expect(
        scrollIntoView.mock.calls.map(([options]) => options.behavior),
      ).toEqual(['smooth', 'auto', 'auto'])
    })

    test('glides again for a single move after the drag has stopped', () => {
      chartsInPage()
      const { result } = renderHook(() =>
        useChartScrollSync({ enabled: true, index: 0, onIndex: vi.fn() }),
      )

      act(() => result.current.scrollToChart(1))
      act(() => vi.advanceTimersByTime(1000))
      act(() => result.current.scrollToChart(4))

      expect(
        scrollIntoView.mock.calls.map(([options]) => options.behavior),
      ).toEqual(['smooth', 'smooth'])
    })

    test('jumps instead of gliding for visitors who prefer less motion', () => {
      vi.stubGlobal('matchMedia', () => ({ matches: true }))
      chartsInPage()
      const { result } = renderHook(() =>
        useChartScrollSync({ enabled: true, index: 0, onIndex: vi.fn() }),
      )

      act(() => result.current.scrollToChart(2))

      expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({
        block: 'start',
        behavior: 'auto',
      })
    })

    test('does nothing for a chart that is not on the page', () => {
      chartsInPage(2)
      const { result } = renderHook(() =>
        useChartScrollSync({ enabled: true, index: 0, onIndex: vi.fn() }),
      )

      expect(() => act(() => result.current.scrollToChart(9))).not.toThrow()
      expect(scrollIntoView).not.toHaveBeenCalled()
    })

    // Scrolling passes every chart on the way. Reporting each of them would drag
    // the handle back through the charts, away from where the visitor put it.
    test('does not follow the page while it scrolls to where it was sent', () => {
      chartsInPage()
      const onIndex = vi.fn()
      const { result } = renderHook(() =>
        useChartScrollSync({ enabled: true, index: 0, onIndex }),
      )
      act(() => vi.advanceTimersByTime(50))

      act(() => result.current.scrollToChart(4))
      act(() => observers[0].callback([see(1)]))
      expect(onIndex).not.toHaveBeenCalled()

      act(() => vi.advanceTimersByTime(1500))
      act(() => observers[0].callback([see(4)]))
      expect(onIndex).toHaveBeenCalledExactlyOnceWith(4)
    })
  })

  describe('coming back to the list', () => {
    test('returns to the chart the visitor was on', () => {
      const { rerender } = renderHook(
        ({ enabled }) =>
          useChartScrollSync({ enabled, index: 3, onIndex: vi.fn() }),
        { initialProps: { enabled: false } },
      )
      scrollIntoView.mockClear()

      // The list is mounted a little after the viewer closes.
      rerender({ enabled: true })
      act(() => vi.advanceTimersByTime(100))
      expect(scrollIntoView).not.toHaveBeenCalled()
      chartsInPage()
      act(() => vi.advanceTimersByTime(100))

      expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({
        block: 'start',
        behavior: 'auto',
      })
      expect(scrollIntoView.mock.contexts[0]).toBe(
        document.querySelector('[data-chart-index="3"]'),
      )
    })

    test('does not scroll when the page first loads', () => {
      chartsInPage()

      renderHook(() =>
        useChartScrollSync({ enabled: true, index: 3, onIndex: vi.fn() }),
      )
      act(() => vi.advanceTimersByTime(500))

      expect(scrollIntoView).not.toHaveBeenCalled()
    })

    test('does not scroll when returning to the first chart', () => {
      chartsInPage()
      const { rerender } = renderHook(
        ({ enabled }) =>
          useChartScrollSync({ enabled, index: 0, onIndex: vi.fn() }),
        { initialProps: { enabled: false } },
      )

      rerender({ enabled: true })
      act(() => vi.advanceTimersByTime(500))

      expect(scrollIntoView).not.toHaveBeenCalled()
    })

    test('gives up quietly if the list never appears', () => {
      const { rerender } = renderHook(
        ({ enabled }) =>
          useChartScrollSync({ enabled, index: 3, onIndex: vi.fn() }),
        { initialProps: { enabled: false } },
      )

      rerender({ enabled: true })

      expect(() => act(() => vi.advanceTimersByTime(10_000))).not.toThrow()
      expect(vi.getTimerCount()).toBe(0)
    })
  })
})
