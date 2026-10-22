import { act, fireEvent, render, screen } from '@testing-library/react'
import { createStore, Provider } from 'jotai'

import { AnimationProvider } from '@/components/Animation/Animation'
import { showViewerAtom } from '@/components/Atoms/GlobalState'
import { SkinnyChartData } from '@/shared/types/chartData'

import { FooterControl } from './FooterControl'

const charts: SkinnyChartData[] = [0, 1, 2, 3, 4].map((hour) => ({
  imageDateUTC: Date.UTC(2026, 9, 1, hour),
  url: `https://example.com/${hour}.webp`,
}))
const times = charts.map((chart) => chart.imageDateUTC)

const renderFooter = (props: { withList?: boolean } = {}) =>
  render(
    <AnimationProvider count={charts.length} times={times}>
      {props.withList && (
        <ul>
          {charts.map((chart, i) => (
            <li key={chart.url} data-chart-index={i} />
          ))}
        </ul>
      )}
      <FooterControl />
    </AnimationProvider>,
  )

const open = () =>
  fireEvent.click(screen.getByLabelText('Show animated weather chart'))
const slider = () => screen.getByLabelText('Chart position') as HTMLInputElement

describe('<FooterControl />', () => {
  describe('the controls', () => {
    test('opens the viewer paused, and closes it again', () => {
      renderFooter()
      open()

      expect(screen.getByLabelText('Play animation')).toBeInTheDocument()

      fireEvent.click(screen.getByLabelText('Show static weather chart list'))
      expect(
        screen.getByLabelText('Show animated weather chart'),
      ).toBeInTheDocument()
      expect(screen.queryByLabelText('Play animation')).toBeNull()
    })

    // Only the button that switches views is there until the viewer opens.
    test('offers only the view switch while the list is showing', () => {
      renderFooter()

      expect(
        screen.getByLabelText('Show animated weather chart'),
      ).toBeInTheDocument()
      expect(screen.queryByLabelText('Play animation')).toBeNull()
      expect(screen.queryByLabelText('Step forward')).toBeNull()
      expect(screen.queryByLabelText('Step backward')).toBeNull()
    })

    // One control, one job: opening the viewer does not start playback.
    test('playing and pausing are their own control', () => {
      renderFooter()
      open()

      fireEvent.click(screen.getByLabelText('Play animation'))
      expect(screen.getByLabelText('Pause animation')).toBeInTheDocument()
      fireEvent.click(screen.getByLabelText('Pause animation'))

      expect(screen.getByLabelText('Play animation')).toBeInTheDocument()
    })

    test('stepping stops at the first and last chart', () => {
      renderFooter()
      open()

      fireEvent.click(screen.getByLabelText('Step backward'))
      expect(slider().value).toBe('0')

      for (let i = 0; i < 10; i++) {
        fireEvent.click(screen.getByLabelText('Step forward'))
      }
      expect(slider().value).toBe('4')
    })
  })

  describe('the time axis', () => {
    // It used to appear only in the viewer. Now it is how you move through the
    // list too.
    test('is there in the list and in the viewer', () => {
      renderFooter()
      expect(slider()).toBeInTheDocument()

      open()
      expect(slider()).toBeInTheDocument()
    })

    test('spans exactly the charts', () => {
      renderFooter()

      expect(slider().max).toBe('4')
    })

    test('draws a tick for each chart', () => {
      const { container } = renderFooter()

      expect(container.querySelectorAll('[data-tick]')).toHaveLength(5)
    })

    // Dragging the slider used to leave the interval running, so playback
    // fought the user for the position.
    test('dragging it pauses playback and moves to that chart', () => {
      renderFooter()
      open()
      fireEvent.click(screen.getByLabelText('Play animation'))
      expect(screen.getByLabelText('Pause animation')).toBeInTheDocument()

      fireEvent.change(slider(), { target: { value: '3' } })

      expect(screen.getByLabelText('Play animation')).toBeInTheDocument()
      expect(slider().value).toBe('3')
    })

    // A bare range input is announced as a percentage; say which chart it is.
    test('describes the position in words for assistive technology', () => {
      renderFooter()
      open()
      expect(slider()).toHaveAttribute('aria-valuetext', 'Chart 1 of 5')

      fireEvent.click(screen.getByLabelText('Step forward'))

      expect(slider()).toHaveAttribute('aria-valuetext', 'Chart 2 of 5')
    })

    test('keeps the chart you were on when you open and close the viewer', () => {
      renderFooter()
      fireEvent.change(slider(), { target: { value: '3' } })

      open()
      expect(slider().value).toBe('3')

      fireEvent.click(screen.getByLabelText('Show static weather chart list'))
      expect(slider().value).toBe('3')
    })
  })

  describe('scrolling the list', () => {
    const scrollIntoView = vi.fn()

    beforeEach(() => {
      scrollIntoView.mockClear()
      Element.prototype.scrollIntoView = scrollIntoView
    })

    test('dragging the axis scrolls the list to that chart', () => {
      renderFooter({ withList: true })

      fireEvent.change(slider(), { target: { value: '3' } })

      expect(scrollIntoView).toHaveBeenCalledTimes(1)
      expect(scrollIntoView.mock.contexts[0]).toBe(
        document.querySelector('[data-chart-index="3"]'),
      )
    })

    test('does not scroll anything while the viewer is open', () => {
      renderFooter({ withList: true })
      open()
      scrollIntoView.mockClear()

      fireEvent.change(slider(), { target: { value: '3' } })

      expect(scrollIntoView).not.toHaveBeenCalled()
    })

    test('follows the chart that scrolls into view', () => {
      let report: ((entries: unknown[]) => void) | undefined
      vi.stubGlobal(
        'IntersectionObserver',
        class {
          constructor(callback: (entries: unknown[]) => void) {
            report = callback
          }
          observe() {}
          disconnect() {}
        },
      )
      renderFooter({ withList: true })

      act(() =>
        report?.([
          {
            target: document.querySelector('[data-chart-index="2"]'),
            isIntersecting: true,
            intersectionRatio: 1,
          },
        ]),
      )

      expect(slider().value).toBe('2')
      vi.unstubAllGlobals()
    })
  })

  describe('hiding the animated viewer in Settings', () => {
    test('closes a viewer that is open when the setting is turned off', () => {
      const store = createStore()
      render(
        <Provider store={store}>
          <AnimationProvider count={charts.length} times={times}>
            <FooterControl />
          </AnimationProvider>
        </Provider>,
      )
      open()
      expect(screen.getByLabelText('Play animation')).toBeInTheDocument()

      act(() => store.set(showViewerAtom, false))

      expect(screen.queryByLabelText('Play animation')).toBeNull()
    })

    test('marks the viewer, the slider and the footer so the page can hide them', () => {
      const { container } = renderFooter()

      expect(container.querySelector('footer')).toHaveAttribute('data-footer')
      expect(container.querySelector('[data-footer-viewer]')).toContainElement(
        screen.getByLabelText('Show animated weather chart'),
      )
      expect(container.querySelector('[data-footer-slider]')).toContainElement(
        slider(),
      )
      expect(container.querySelector('[data-footer-gap]')).not.toBeNull()
    })
  })
})
