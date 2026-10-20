import { fireEvent, render, screen, within } from '@testing-library/react'
import { createStore, Provider } from 'jotai'

import { rainStripPinAtom } from '@/components/Atoms/GlobalState'
import { type Pin, pinFromPlace } from '@/shared/helpers/pins/pins'
import type { RainReading } from '@/shared/helpers/rainStrip/readRain'

import { RainStrip } from './RainStrip'
import type { RainReadings } from './useRainReadings'

const place = (name: string, latitude: number, longitude: number) =>
  pinFromPlace({ name, context: 'NZ', kind: 'Town', latitude, longitude })
const wanaka = place('Wanaka', -44.703, 169.132)
const auckland = place('Auckland', -36.848, 174.763)
const paris = place('Paris', 48.85, 2.35)

const urls = ['/a', '/b', '/c']
const times = [
  Date.UTC(2026, 9, 21, 0),
  Date.UTC(2026, 9, 21, 6),
  Date.UTC(2026, 9, 21, 12),
]
const axis = {
  percent: (position: number) => `${position * 40}%`,
  pixelsPerChart: 40,
}

const clear: RainReading = { kind: 'clear' }
const rain = (band: number): RainReading => ({ kind: 'rain', band })

const renderStrip = ({
  pins = [wanaka],
  readings = new Map(),
  index = 0,
  choice,
  onSeek = vi.fn(),
}: {
  pins?: Pin[]
  readings?: RainReadings
  index?: number
  choice?: string
  onSeek?: (index: number) => void
} = {}) => {
  const store = createStore()
  if (choice) store.set(rainStripPinAtom, choice)
  const view = render(
    <Provider store={store}>
      <RainStrip
        region="nz"
        pins={pins}
        chartUrls={urls}
        times={times}
        index={index}
        readings={readings}
        onSeek={onSeek}
        axis={axis}
      />
    </Provider>,
  )
  return { store, onSeek, ...view }
}
const cells = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('[data-rain-cell]'))

describe('<RainStrip />', () => {
  test('shows nothing with no pins', () => {
    const { container } = renderStrip({ pins: [] })

    expect(container).toBeEmptyDOMElement()
  })

  test('has a cell for each chart, coloured by the band of rain there', () => {
    const readings: RainReadings = new Map([
      ['/a', { [wanaka.id]: clear }],
      ['/b', { [wanaka.id]: rain(4) }],
      ['/c', { [wanaka.id]: rain(19) }],
    ])
    const { container } = renderStrip({ readings })

    const [a, b, c] = cells(container)
    expect(a.style.backgroundColor).toBe('rgb(230, 230, 255)')
    expect(b.style.backgroundColor).toBe('rgb(0, 0, 255)')
    expect(c.style.backgroundColor).toBe('rgb(255, 63, 0)')
  })

  test('draws a chart not read yet as an empty cell, not as dry', () => {
    const { container } = renderStrip({
      readings: new Map([['/a', { [wanaka.id]: clear }]]),
    })

    const [, b] = cells(container)
    expect(b).toHaveAttribute('data-reading', 'unknown')
    expect(b.style.backgroundColor).toBe('')
  })

  test('puts each cell where its chart is on the time axis', () => {
    const { container } = renderStrip()

    expect(cells(container).map((cell) => cell.style.left)).toEqual([
      '0%',
      '40%',
      '80%',
    ])
  })

  test('goes to a chart when its cell is tapped', () => {
    const { container, onSeek } = renderStrip()

    fireEvent.click(cells(container)[2])

    expect(onSeek).toHaveBeenCalledWith(2)
  })

  test('says what the chart in view shows at the pin', () => {
    const readings: RainReadings = new Map([['/b', { [wanaka.id]: rain(4) }]])
    const { container } = renderStrip({ readings, index: 1 })

    expect(container.querySelector('[data-rain-reading]')).toHaveTextContent(
      '5–6 mm in 6 hr',
    )
  })

  test('says under 1 mm where a chart is clear', () => {
    const { container } = renderStrip({
      readings: new Map([['/a', { [wanaka.id]: clear }]]),
    })

    expect(container.querySelector('[data-rain-reading]')).toHaveTextContent(
      'under 1 mm',
    )
  })

  test('reads the chart in view out, for a screen reader', () => {
    renderStrip({ readings: new Map([['/a', { [wanaka.id]: clear }]]) })

    expect(screen.getByRole('status')).toHaveTextContent('Wanaka: under 1 mm')
  })

  test('says a pin is not on the chart, and draws no cells', () => {
    const { container } = renderStrip({ pins: [paris] })

    expect(container.querySelector('[data-rain-reading]')).toHaveTextContent(
      'not on this chart',
    )
    expect(cells(container)).toHaveLength(0)
  })

  describe('with several pins', () => {
    const pins = [wanaka, auckland]

    test('has a selector of the pins, and all pins', () => {
      renderStrip({ pins })

      const select = screen.getByLabelText('Pin for the rain strip')
      expect(
        within(select)
          .getAllByRole('option')
          .map((o) => o.textContent),
      ).toEqual(['Wanaka', 'Auckland', 'All pins'])
    })

    test('has no selector with one pin', () => {
      renderStrip({ pins: [wanaka] })

      expect(screen.queryByLabelText('Pin for the rain strip')).toBeNull()
    })

    test('shows the first pin until another is chosen', () => {
      const { container } = renderStrip({ pins })

      expect(container.querySelectorAll('[data-rain-row]')).toHaveLength(1)
      expect(
        container.querySelector(`[data-rain-row="${wanaka.id}"]`),
      ).not.toBeNull()
    })

    test('shows the pin that was chosen, and remembers it', () => {
      const { container, store } = renderStrip({ pins })

      fireEvent.change(screen.getByLabelText('Pin for the rain strip'), {
        target: { value: auckland.id },
      })

      expect(
        container.querySelector(`[data-rain-row="${auckland.id}"]`),
      ).not.toBeNull()
      expect(store.get(rainStripPinAtom)).toBe(auckland.id)
    })

    test('shows a row for each pin with all pins', () => {
      const { container } = renderStrip({ pins, choice: 'all' })

      expect(container.querySelectorAll('[data-rain-row]')).toHaveLength(2)
      expect(screen.getByLabelText('Pin for the rain strip')).toHaveValue('all')
      expect(
        screen.getByText('Auckland', { selector: 'span' }),
      ).toBeInTheDocument()
    })

    test('starts from the first pin when the one remembered has been removed', () => {
      const { container } = renderStrip({ pins, choice: 'gone|0|0' })

      expect(
        container.querySelector(`[data-rain-row="${wanaka.id}"]`),
      ).not.toBeNull()
    })
  })
})
