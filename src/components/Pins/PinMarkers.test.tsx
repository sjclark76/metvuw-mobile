import { act, render } from '@testing-library/react'
import { createStore, Provider } from 'jotai'

import { pinsAtom } from '@/components/Atoms/GlobalState'
import type { Pin } from '@/shared/helpers/pins/pins'
import { pinFromPlace } from '@/shared/helpers/pins/pins'

import { PinMarkers } from './PinMarkers'

const wanaka: Pin = pinFromPlace({
  name: 'Wanaka',
  context: 'Otago',
  kind: 'Town',
  latitude: -44.703,
  longitude: 169.132,
})
const hooker: Pin = pinFromPlace({
  name: 'Hooker Hut',
  context: 'Canterbury',
  kind: 'Hut',
  latitude: -43.6,
  longitude: 170,
})
const london: Pin = pinFromPlace({
  name: 'London',
  context: 'England, United Kingdom',
  kind: 'Capital',
  latitude: 51.509,
  longitude: -0.126,
})

const renderMarkers = (
  region: 'nz' | 'nzsi' | 'europe' | 'world',
  pins: Pin[],
) => {
  const store = createStore()
  store.set(pinsAtom, pins)
  return render(
    <Provider store={store}>
      <div data-testid="chart">
        <PinMarkers region={region} />
      </div>
    </Provider>,
  )
}
const markers = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>('[data-pin-marker]'),
]
const at = (marker: HTMLElement) => ({
  left: parseFloat(marker.style.left),
  top: parseFloat(marker.style.top),
})

describe('<PinMarkers />', () => {
  // Expected positions worked out apart from the code, by applying the chart
  // calibration to each place (percent across and down the processed chart).
  test.each([
    ['nz', 47.79, 68.71],
    ['nzsi', 45.55, 59.32],
    ['world', 92.86, 77.95],
  ] as const)(
    'puts Wanaka where the %s chart shows it',
    (region, left, top) => {
      const { container } = renderMarkers(region, [wanaka])

      const [marker] = markers(container)
      expect(at(marker).left).toBeCloseTo(left, 1)
      expect(at(marker).top).toBeCloseTo(top, 1)
    },
  )

  test('puts a second pin at its own spot', () => {
    const { container } = renderMarkers('nz', [wanaka, hooker])

    const [, second] = markers(container)
    expect(second.dataset.pinName).toBe('Hooker Hut')
    expect(at(second).left).toBeCloseTo(49.91, 1)
    expect(at(second).top).toBeCloseTo(63.36, 1)
  })

  test('draws nothing for a pin the chart does not show', () => {
    const { container } = renderMarkers('europe', [wanaka, hooker])

    expect(markers(container)).toHaveLength(0)
    expect(container.querySelector('[data-pin-markers]')).toBeNull()
  })

  test('draws only the pins this chart shows', () => {
    const { container } = renderMarkers('world', [london, wanaka])

    expect(markers(container).map((m) => m.dataset.pinName)).toEqual([
      'London',
      'Wanaka',
    ])
    expect(
      markers(renderMarkers('europe', [london, wanaka]).container).map(
        (m) => m.dataset.pinName,
      ),
    ).toEqual(['London'])
  })

  test('draws nothing when nothing is pinned', () => {
    const { container } = renderMarkers('nz', [])

    expect(markers(container)).toHaveLength(0)
  })

  test('names a pin by its full name', () => {
    const { container } = renderMarkers('nz', [wanaka])

    expect(container.querySelector('[data-pin-label]')?.textContent).toBe(
      'Wanaka',
    )
  })

  test('names a pin by its label when it has one', () => {
    const { container } = renderMarkers('nz', [{ ...wanaka, label: 'Home' }])

    expect(container.querySelector('[data-pin-label]')?.textContent).toBe(
      'Home',
    )
  })

  test('puts the name on the right of a ring near the left, and on the left near the right', () => {
    const left = renderMarkers('nz', [wanaka]).container.querySelector(
      '[data-pin-label]',
    )!
    // On the world chart Wanaka is near the right edge.
    const right = renderMarkers('world', [wanaka]).container.querySelector(
      '[data-pin-label]',
    )!

    expect(left).toHaveClass('left-full')
    expect(right).toHaveClass('right-full')
  })

  test('sits on top of the chart without taking part in it', () => {
    const { container } = renderMarkers('nz', [wanaka])
    const layer = container.querySelector('[data-pin-markers]')!

    expect(layer).toHaveClass('absolute', 'inset-0', 'pointer-events-none')
    expect(layer).toHaveAttribute('aria-hidden', 'true')
  })

  // The chart is covered in small hollow black circles (its wind-barb grid): a hollow
  // marker was lost among them.
  test('is a solid orange dot with a white edge, not a hollow ring', () => {
    const { container } = renderMarkers('nz', [wanaka])
    const dot = container.querySelector('[data-pin-dot]')!

    expect(dot.className).toMatch(/bg-\[#ff6a00\]/)
    expect(dot.className).toMatch(/border-white/)
    expect(dot.className).not.toMatch(/bg-transparent/)
    expect(dot.className).toMatch(/rounded-full/)
  })

  test('draws one dot for each pin', () => {
    const { container } = renderMarkers('world', [london, wanaka])

    expect(container.querySelectorAll('[data-pin-dot]')).toHaveLength(2)
  })

  test('uses colours that read on the chart, which is light in both themes', () => {
    const { container } = renderMarkers('nz', [wanaka])
    const label = container.querySelector('[data-pin-label]')!

    expect(label.className).toMatch(/text-\[#1b1740\]/)
    expect(label.className).not.toMatch(/text-ink/)
  })

  test('draws a pin when it is added, and stops when it is removed', () => {
    const store = createStore()
    store.set(pinsAtom, [])
    const { container } = render(
      <Provider store={store}>
        <PinMarkers region="nz" />
      </Provider>,
    )
    expect(markers(container)).toHaveLength(0)

    act(() => store.set(pinsAtom, [wanaka]))
    expect(markers(container)).toHaveLength(1)

    act(() => store.set(pinsAtom, []))
    expect(markers(container)).toHaveLength(0)
  })
})
