import { act, fireEvent, render, screen } from '@testing-library/react'

import { pinFromPlace } from '@/shared/helpers/pins/pins'
import { loadPlaceSearch, type Place } from '@/shared/helpers/places'

import { PinWhereIAm } from './PinWhereIAm'

vi.mock('@/shared/helpers/places', () => ({ loadPlaceSearch: vi.fn() }))

const hawea: Place = {
  name: 'Lake Hawea',
  context: 'Otago',
  kind: 'Town',
  latitude: -44.61,
  longitude: 169.26,
}

type Success = (position: {
  coords: { latitude: number; longitude: number }
}) => void
type Failure = (error: { code: number; PERMISSION_DENIED: number }) => void

let succeed: Success = () => {}
let fail: Failure = () => {}
const getCurrentPosition = vi.fn((onSuccess: Success, onError: Failure) => {
  succeed = onSuccess
  fail = onError
})

const button = () => screen.getByRole('button', { name: 'Pin where I am' })
const status = (container: HTMLElement) =>
  container.querySelector('[data-locate-status]')

const renderButton = (pinned: string[] = []) => {
  const onPick = vi.fn()
  const view = render(<PinWhereIAm pinned={new Set(pinned)} onPick={onPick} />)
  return { onPick, ...view }
}

describe('<PinWhereIAm />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition },
      configurable: true,
    })
    vi.mocked(loadPlaceSearch).mockResolvedValue({
      search: () => [],
      nearest: () => ({ place: hawea, distanceKm: 2.96 }),
    })
  })

  test('is not there when the browser cannot tell where it is', () => {
    // @ts-expect-error -- removing it, as in a browser without it.
    delete navigator.geolocation

    renderButton()

    expect(screen.queryByRole('button', { name: 'Pin where I am' })).toBeNull()
  })

  test('asks where the visitor is only when pressed', () => {
    renderButton()
    expect(getCurrentPosition).not.toHaveBeenCalled()

    fireEvent.click(button())

    expect(getCurrentPosition).toHaveBeenCalledTimes(1)
    expect(button()).toBeDisabled()
  })

  test('pins the spot, named after the nearest place, and says so', async () => {
    const { onPick, container } = renderButton()
    fireEvent.click(button())

    await act(async () =>
      succeed({ coords: { latitude: -44.59, longitude: 169.285 } }),
    )

    expect(onPick).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Near Lake Hawea · 3 km NE',
        kind: 'Your location',
        latitude: -44.59,
        longitude: 169.285,
      }),
    )
    expect(status(container)).toHaveTextContent(
      'Pinned Near Lake Hawea · 3 km NE',
    )
    expect(button()).toBeEnabled()
  })

  test('names the spot by its coordinates when the place list cannot be had', async () => {
    vi.mocked(loadPlaceSearch).mockRejectedValue(new Error('offline'))
    const { onPick } = renderButton()
    fireEvent.click(button())

    await act(async () =>
      succeed({ coords: { latitude: -44.59, longitude: 169.286 } }),
    )

    expect(onPick).toHaveBeenCalledWith(
      expect.objectContaining({ name: '44.59°S 169.29°E' }),
    )
  })

  test('does not pin a spot twice', async () => {
    const already = pinFromPlace({
      name: 'Near Lake Hawea · 3 km NE',
      context: 'Otago',
      kind: 'Your location',
      latitude: -44.59,
      longitude: 169.285,
    })
    const { onPick, container } = renderButton([already.id])
    fireEvent.click(button())

    await act(async () =>
      succeed({ coords: { latitude: -44.59, longitude: 169.285 } }),
    )

    expect(onPick).not.toHaveBeenCalled()
    expect(status(container)).toHaveTextContent('Already pinned')
  })

  test('says how to turn location on when it is refused', () => {
    const { container } = renderButton()
    fireEvent.click(button())

    act(() => fail({ code: 1, PERMISSION_DENIED: 1 }))

    expect(status(container)).toHaveTextContent(
      /Location is turned off for this site/,
    )
    expect(button()).toBeEnabled()
  })

  test('says to try again when no fix comes', () => {
    const { container } = renderButton()
    fireEvent.click(button())

    act(() => fail({ code: 3, PERMISSION_DENIED: 1 }))

    expect(status(container)).toHaveTextContent(/Couldn’t find where you are/)
  })
})
