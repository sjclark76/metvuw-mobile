import { act, render } from '@testing-library/react'
import { createStore, Provider } from 'jotai'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'

import { pinsAtom } from '@/components/Atoms/GlobalState'
import { pinFromPlace } from '@/shared/helpers/pins/pins'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { findRegionByCode } from '@/shared/types/region'

import { WeatherChart } from './WeatherChart'

const chart: SkinnyRainChartData = {
  forecastDate: '2026-10-15T14:00:00.000Z',
  imageDateUTC: Date.UTC(2026, 9, 15, 8),
  url: 'https://example.com/chart.webp',
}
const wanaka = pinFromPlace({
  name: 'Wanaka',
  context: 'Otago',
  kind: 'Town',
  latitude: -44.703,
  longitude: 169.132,
})
const ui = (region: string) => (
  <WeatherChart chart={chart} region={findRegionByCode(region)!} index={0} />
)

describe('<WeatherChart /> pins', () => {
  beforeEach(() => localStorage.clear())

  test('marks a pinned place on the chart, over the image', () => {
    const store = createStore()
    store.set(pinsAtom, [wanaka])

    const { container } = render(<Provider store={store}>{ui('nz')}</Provider>)

    const image = container.querySelector('img')!
    const marker = container.querySelector<HTMLElement>('[data-pin-marker]')!
    expect(marker.dataset.pinName).toBe('Wanaka')
    // The markers share a box with the image, so a percentage is a place on it.
    expect(marker.closest('div.relative')).toContainElement(image)
  })

  test('marks nothing on a chart that does not show the place', () => {
    const store = createStore()
    store.set(pinsAtom, [wanaka])

    const { container } = render(
      <Provider store={store}>{ui('europe')}</Provider>,
    )

    expect(container.querySelector('[data-pin-marker]')).toBeNull()
  })

  test('marks nothing when nothing is pinned', () => {
    const { container } = render(ui('nz'))

    expect(container.querySelector('[data-pin-marker]')).toBeNull()
  })

  // The page is built without knowing the visitor's pins; React must not find the
  // browser's first render different from it when it takes the page over.
  test('hydrates a page whose visitor has pins without a mismatch, then marks them', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const html = renderToString(ui('nz'))
    const store = createStore()
    store.set(pinsAtom, [wanaka])

    const container = document.createElement('div')
    container.innerHTML = html
    document.body.appendChild(container)
    const onRecoverableError = vi.fn()
    await act(async () => {
      hydrateRoot(container, <Provider store={store}>{ui('nz')}</Provider>, {
        onRecoverableError,
      })
    })

    expect(onRecoverableError).not.toHaveBeenCalled()
    expect(container.querySelector('[data-pin-marker]')).not.toBeNull()
    container.remove()
    vi.restoreAllMocks()
  })
})
