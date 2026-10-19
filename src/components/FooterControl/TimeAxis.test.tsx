import { fireEvent, render, screen } from '@testing-library/react'
import { ComponentProps } from 'react'
import { renderToString } from 'react-dom/server'

import { formatInTimeZone } from '@/shared/helpers/timeZone'

import { TimeAxis } from './TimeAxis'

vi.mock('@/components/Hooks/useFormatDate', () => ({
  useFormatDate: () => (date: Date | number | string, format: string) =>
    formatInTimeZone(date, format, 'Pacific/Auckland'),
}))

const HOUR = 36e5
// Twelve six-hourly charts from 00Z on 19 Oct 2026: 13:00 Monday in NZDT.
const first = Date.UTC(2026, 9, 19)
const times = Array.from({ length: 12 }, (_, i) => first + i * 6 * HOUR)

const renderAxis = (props: Partial<ComponentProps<typeof TimeAxis>> = {}) => {
  const onSeek = vi.fn()
  const view = render(
    <TimeAxis
      times={times}
      index={0}
      max={times.length - 1}
      onSeek={onSeek}
      {...props}
    />,
  )
  return { onSeek, ...view }
}

const slider = () => screen.getByRole('slider', { name: 'Chart position' })
const handle = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-handle]')!

describe('<TimeAxis />', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('the control', () => {
    test('is a slider over the charts, described in words', () => {
      renderAxis({ index: 2 })

      expect(slider()).toHaveAttribute('min', '0')
      expect(slider()).toHaveAttribute('max', String(times.length - 1))
      expect(slider()).toHaveValue('2')
      expect(slider()).toHaveAttribute(
        'aria-valuetext',
        `Chart 3 of ${times.length}`,
      )
    })

    test('reports the chart the visitor moves to, as a number', () => {
      const { onSeek } = renderAxis()

      fireEvent.change(slider(), { target: { value: '4' } })

      expect(onSeek).toHaveBeenCalledExactlyOnceWith(4)
    })

    // The browser's own range input gives keyboard, touch and screen reader
    // support for free; the drawing sits over it.
    test('is the browser range input, not a lookalike', () => {
      renderAxis()

      expect(slider().tagName).toBe('INPUT')
      expect(slider()).toHaveAttribute('type', 'range')
    })

    test('keeps the drawing out of the accessibility tree', () => {
      const { container } = renderAxis()

      expect(container.querySelector('[data-axis-drawing]')).toHaveAttribute(
        'aria-hidden',
        'true',
      )
    })
  })

  describe('the drawing', () => {
    test('has one tick for each chart', () => {
      const { container } = renderAxis()

      expect(container.querySelectorAll('[data-tick]')).toHaveLength(
        times.length,
      )
    })

    test('names each day where it begins', () => {
      renderAxis()

      // 13:00 Monday to 10:00 Thursday, in NZDT.
      expect(screen.getByText('Tue')).toBeInTheDocument()
      expect(screen.getByText('Wed')).toBeInTheDocument()
      expect(screen.getByText('Thu')).toBeInTheDocument()
      expect(screen.queryByText('Mon')).toBeNull()
    })

    test('labels the handle with the chart it is on', () => {
      renderAxis({ index: 1 })

      // 06Z is 19:00 Monday in NZDT.
      expect(screen.getByText('Mon 19:00')).toBeInTheDocument()
    })

    test('moves the handle to the chosen chart', () => {
      const { container, rerender } = renderAxis({ index: 0 })
      expect(handle(container).dataset.at).toBe('0')

      rerender(
        <TimeAxis
          times={times}
          index={times.length - 1}
          max={times.length - 1}
          onSeek={vi.fn()}
        />,
      )

      expect(handle(container).dataset.at).toBe('1')
    })

    test('marks now when it falls within the charts', () => {
      vi.useFakeTimers()
      vi.setSystemTime(first + 15 * HOUR)

      renderAxis()

      expect(screen.getByText('Now')).toBeInTheDocument()
    })

    test('says nothing about now when it is outside the charts', () => {
      vi.useFakeTimers()
      vi.setSystemTime(first + 400 * HOUR)

      renderAxis()

      expect(screen.queryByText('Now')).toBeNull()
    })

    // The host renders this page ahead of time on its own clock, so "now" is
    // only worked out in the browser, after hydration. Otherwise the markup
    // would not match and React would report a mismatch.
    test('is not drawn in the markup rendered ahead of time', () => {
      vi.useFakeTimers()
      vi.setSystemTime(first + 15 * HOUR)

      const html = renderToString(
        <TimeAxis
          times={times}
          index={0}
          max={times.length - 1}
          onSeek={vi.fn()}
        />,
      )

      expect(html).not.toContain('Now')
    })
  })

  describe('with little to draw', () => {
    test('still works for a page that has no times', () => {
      const { container } = renderAxis({ times: [], max: 3, index: 1 })

      expect(slider()).toHaveValue('1')
      expect(container.querySelectorAll('[data-tick]')).toHaveLength(0)
    })

    test('copes with a single chart', () => {
      const { container } = renderAxis({ times: [first], max: 0, index: 0 })

      expect(handle(container).dataset.at).toBe('0')
    })
  })

  describe('on a narrow screen', () => {
    // Forty charts is what a region page really has.
    const many = Array.from({ length: 40 }, (_, i) => first + i * 6 * HOUR)

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    function stubWidth(width: number) {
      vi.stubGlobal(
        'ResizeObserver',
        class {
          constructor(private callback: () => void) {}
          observe(element: Element) {
            Object.defineProperty(element, 'clientWidth', {
              configurable: true,
              value: width,
            })
            this.callback()
          }
          disconnect() {}
        },
      )
    }

    test('draws fewer ticks than charts, so they do not blur into a barcode', () => {
      stubWidth(250)
      const { container } = renderAxis({ times: many, max: 39 })

      const ticks = container.querySelectorAll('[data-tick]').length
      expect(ticks).toBeGreaterThan(5)
      expect(ticks).toBeLessThan(30)
    })

    test('draws every tick on a wide screen', () => {
      stubWidth(900)
      const { container } = renderAxis({ times: many, max: 39 })

      expect(container.querySelectorAll('[data-tick]')).toHaveLength(40)
    })

    test('still names the days, and still reaches every chart', () => {
      stubWidth(250)
      renderAxis({ times: many, max: 39 })

      expect(
        screen.getAllByText(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/).length,
      ).toBeGreaterThan(3)
      expect(slider()).toHaveAttribute('max', '39')
    })

    // The handle is wider than a tick, so the track stops short of both edges by
    // half a handle. Otherwise it sticks out over the view switch beside it.
    test('keeps the handle clear of the edges at the first and last chart', () => {
      const { container, rerender } = renderAxis({ index: 0 })
      expect(handle(container).style.left).toContain('0.75rem')

      rerender(
        <TimeAxis
          times={times}
          index={times.length - 1}
          max={times.length - 1}
          onSeek={vi.fn()}
        />,
      )

      expect(handle(container).style.left).toContain('0.75rem')
      expect(handle(container).style.left).toContain('100% - 1.5rem')
    })

    // Two lines at the same spot only look like one heavier line, and add noise.
    test('does not draw a minor tick on top of a day line', () => {
      stubWidth(900)
      // NZDT is +13, so 11:00Z is local midnight: the day line falls on a chart.
      const midnight = Date.UTC(2026, 9, 19, 11)
      const onMidnight = [-6, 0, 6, 12].map((hours) => midnight + hours * HOUR)

      const { container } = renderAxis({ times: onMidnight, max: 3 })

      expect(container.querySelectorAll('[data-tick]')).toHaveLength(3)
    })

    test('keeps the minor ticks on a phone to a handful, not a barcode', () => {
      stubWidth(320)
      const { container } = renderAxis({ times: many, max: 39 })

      // 40 charts over 296px of track is 7.6px a chart: a tick every 3rd or so.
      const ticks = container.querySelectorAll('[data-tick]').length
      expect(ticks).toBeGreaterThan(3)
      expect(ticks).toBeLessThanOrEqual(14)
    })

    test('has a handle big enough for a finger on a touch screen', () => {
      const { container } = renderAxis()

      const handle = container.querySelector('[data-handle]')!
      expect(handle.className).toMatch(/pointer-coarse:h-/)
      expect(handle.className).toMatch(/pointer-coarse:w-/)
    })
  })
})
