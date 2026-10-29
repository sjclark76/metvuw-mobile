import { fireEvent, render, screen } from '@testing-library/react'
import { createStore, Provider } from 'jotai'

import { rainStripPinAtom } from '@/components/Atoms/GlobalState'
import { type Pin, pinFromPlace } from '@/shared/helpers/pins/pins'

import { HeavyRainNote, type PinHeavyRain } from './HeavyRainNote'

const place = (name: string) =>
  pinFromPlace({
    name,
    context: 'Otago',
    kind: 'Town',
    latitude: -44.7,
    longitude: 169.1,
  })
const hawea: Pin = place('Lake Hawea')
const wanaka: Pin = { ...place('Wanaka'), id: 'wanaka' }

const HOUR = 60 * 60 * 1000
// Charts every six hours from 06:00 UTC on Thursday 22 October 2026.
const times = Array.from({ length: 8 }, (_, i) =>
  Date.UTC(2026, 9, 22, 6 + 6 * i),
)

const veryHeavy: PinHeavyRain = {
  pin: hawea,
  rain: { level: 'veryHeavy', from: 2, to: 2 },
}
const heavy: PinHeavyRain = {
  pin: wanaka,
  rain: { level: 'heavy', from: 1, to: 4, atLeastMm: 30 },
}

const renderNote = (
  found: PinHeavyRain[],
  {
    onSeek = vi.fn(),
    watching = true,
    checked = true,
    choice,
  }: {
    onSeek?: (index: number) => void
    watching?: boolean
    checked?: boolean
    choice?: string
  } = {},
) => {
  const store = createStore()
  if (choice) store.set(rainStripPinAtom, choice)
  const view = render(
    <Provider store={store}>
      <HeavyRainNote
        found={found}
        times={times}
        watching={watching}
        checked={checked}
        onSeek={onSeek}
      />
    </Provider>,
  )
  return { store, onSeek, ...view }
}
const note = () => screen.queryByRole('region', { name: 'Heavy rain ahead' })

describe('<HeavyRainNote />', () => {
  beforeEach(() => {
    window.gtag = vi.fn()
  })
  afterEach(() => {
    delete window.gtag
  })

  test('says it is checking until every chart has been read', () => {
    renderNote([], { checked: false })

    expect(note()).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Checking rain at your places…',
    )
  })

  test('says no heavy rain is ahead once every chart has been read', () => {
    renderNote([])

    expect(note()).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent(
      'No heavy rain ahead at your places',
    )
  })

  test('shows the warning, not the status, when rain is found before every chart is read', () => {
    renderNote([veryHeavy], { checked: false })

    expect(note()).not.toBeNull()
    expect(screen.queryByRole('status')).toBeNull()
  })

  test('shows nothing when there is nothing to watch', () => {
    const { container } = renderNote([], { watching: false })

    expect(container).toBeEmptyDOMElement()
  })

  test('says very heavy rain is ahead, how much and from when', () => {
    renderNote([veryHeavy])

    expect(note()).toHaveTextContent('Very heavy rain ahead at Lake Hawea:')
    expect(note()).toHaveTextContent(/20\+ mm in the 6 hours from \w{3} \d/)
  })

  test('starts the very heavy six hours before its chart, as the chart shows the six hours to it', () => {
    renderNote([veryHeavy])

    // The chart is for 18:00 UTC; the six hours it shows begin at 12:00 UTC.
    const from = new Date(times[veryHeavy.rain.to] - 6 * HOUR)
    const hour = from
      .toLocaleString('en-NZ', { hour: 'numeric', hour12: true })
      .replace(/\s/g, '')
      .toLowerCase()
    expect(note()?.textContent?.replace(/\s/g, '').toLowerCase()).toContain(
      `from${from.toLocaleString('en-NZ', { weekday: 'short' })}${hour.replace(/(am|pm)/, ':00$1')}`.toLowerCase(),
    )
  })

  test('says heavy rain is ahead, at least how much, and from when', () => {
    renderNote([heavy])

    expect(note()).toHaveTextContent('Heavy rain ahead at Wanaka:')
    expect(note()).toHaveTextContent(
      /at least 30 mm over the 24 hours from \w{3} \d/,
    )
  })

  test('goes to the chart where it happens when a line is tapped', () => {
    const onSeek = vi.fn()
    renderNote([veryHeavy], { onSeek })

    fireEvent.click(
      screen.getByRole('button', { name: /Very heavy rain ahead/ }),
    )

    expect(onSeek).toHaveBeenCalledWith(2)
  })

  test('shows the tapped place in the rain strip, so the two agree', () => {
    const { store } = renderNote([veryHeavy, heavy], { choice: hawea.id })

    fireEvent.click(
      screen.getByRole('button', { name: /Heavy rain ahead at Wanaka/ }),
    )

    expect(store.get(rainStripPinAtom)).toBe('wanaka')
  })

  test('leaves the rain strip on all places, where the tapped one is already shown', () => {
    const { store } = renderNote([veryHeavy, heavy], { choice: 'all' })

    fireEvent.click(
      screen.getByRole('button', { name: /Heavy rain ahead at Wanaka/ }),
    )

    expect(store.get(rainStripPinAtom)).toBe('all')
  })

  test('shows three pins, then says how many more', () => {
    const many = ['A', 'B', 'C', 'D', 'E'].map((name) => ({
      pin: { ...place(name), id: name },
      rain: veryHeavy.rain,
    }))
    renderNote(many)

    expect(
      screen.getAllByRole('button', { name: /Very heavy rain ahead/ }),
    ).toHaveLength(3)
    expect(note()).toHaveTextContent('and 2 more')
  })

  test('counts being shown, once, and being tapped', () => {
    renderNote([veryHeavy, heavy])
    fireEvent.click(
      screen.getByRole('button', { name: /Very heavy rain ahead/ }),
    )

    const sent = vi
      .mocked(window.gtag!)
      .mock.calls.map(([, name, params]) => [name, params])
    expect(sent).toEqual([
      ['heavy_rain_shown', { level: 'veryHeavy' }],
      ['heavy_rain_opened', { level: 'veryHeavy' }],
    ])
  })

  test('starts the heavy day six hours before its first chart', () => {
    renderNote([heavy])

    // The first of its charts is at 12:00 UTC; the 24 hours begin at 06:00 UTC.
    const from = new Date(times[heavy.rain.from] - 6 * HOUR)
    const expected = from.toLocaleString('en-NZ', { weekday: 'short' })
    expect(note()).toHaveTextContent(`from ${expected}`)
  })
})
