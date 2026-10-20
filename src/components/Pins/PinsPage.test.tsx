import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { createStore, Provider } from 'jotai'

import { pinsAtom } from '@/components/Atoms/GlobalState'
import { type Pin, pinFromPlace } from '@/shared/helpers/pins/pins'
import {
  loadPlaceSearch,
  type Place,
  searchPlaces,
} from '@/shared/helpers/places'

import { PinsPage } from './PinsPage'

vi.mock('@/shared/helpers/places', () => ({
  searchPlaces: vi.fn(),
  loadPlaceSearch: vi.fn(),
  PLACES_ATTRIBUTION: 'Place names: GeoNames, CC BY 4.0',
}))

const wanaka: Place = {
  name: 'Wanaka',
  context: 'Otago',
  kind: 'Town',
  latitude: -44.703,
  longitude: 169.132,
}
const lakeWanaka: Place = {
  name: 'Lake Wanaka',
  context: 'Otago',
  kind: 'Lake',
  latitude: -44.5,
  longitude: 169.1,
}
const hooker: Place = {
  name: 'Hooker Hut',
  context: 'Canterbury',
  kind: 'Hut',
  latitude: -43.6,
  longitude: 170,
}

const renderPage = (pins: Pin[] = []) => {
  const store = createStore()
  store.set(pinsAtom, pins)
  const view = render(
    <Provider store={store}>
      <PinsPage />
    </Provider>,
  )
  return { store, ...view }
}
const stored = (store: ReturnType<typeof createStore>) =>
  store.get(pinsAtom) as Pin[]
const search = (text: string) =>
  fireEvent.change(screen.getByLabelText('Add a place'), {
    target: { value: text },
  })

describe('<PinsPage />', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(loadPlaceSearch).mockResolvedValue(undefined as never)
    vi.mocked(searchPlaces).mockResolvedValue([])
  })

  describe('before anything is pinned', () => {
    test('says how to pin the first place', () => {
      renderPage()

      expect(screen.getByText(/No pins yet/)).toBeInTheDocument()
    })

    test('credits GeoNames, as its licence asks', () => {
      renderPage()

      expect(
        screen.getByText('Place names: GeoNames, CC BY 4.0'),
      ).toBeInTheDocument()
    })

    test('loads the list of places as the page opens, so searching works later', () => {
      renderPage()

      expect(loadPlaceSearch).toHaveBeenCalledTimes(1)
    })

    test('carries on if that load fails', () => {
      vi.mocked(loadPlaceSearch).mockRejectedValue(new Error('offline'))

      expect(() => renderPage()).not.toThrow()
    })
  })

  describe('searching', () => {
    test('lists the matches, each with what it is and where', async () => {
      vi.mocked(searchPlaces).mockResolvedValue([wanaka, lakeWanaka])
      renderPage()

      search('wana')

      const list = await screen.findByRole('list', { name: 'Matching places' })
      const items = within(list).getAllByRole('listitem')
      expect(items).toHaveLength(2)
      expect(items[0]).toHaveTextContent('Wanaka')
      expect(items[0]).toHaveTextContent('Town · Otago')
      expect(items[1]).toHaveTextContent('Lake Wanaka')
      expect(items[1]).toHaveTextContent('Lake · Otago')
    })

    test('does not search for less than two characters', () => {
      renderPage()

      search('w')

      expect(searchPlaces).not.toHaveBeenCalled()
    })

    test('says so when nothing matches', async () => {
      vi.mocked(searchPlaces).mockResolvedValue([])
      renderPage()

      search('xyzzy')

      expect(
        await screen.findByText('No places found for “xyzzy”.'),
      ).toBeInTheDocument()
    })

    test('says what went wrong when the list of places cannot be loaded', async () => {
      vi.mocked(searchPlaces).mockRejectedValue(new Error('offline'))
      renderPage()

      search('wana')

      expect(
        await screen.findByText(/Could not load the list of places/),
      ).toBeInTheDocument()
    })

    test('clearing the box clears the matches', async () => {
      vi.mocked(searchPlaces).mockResolvedValue([wanaka])
      renderPage()
      search('wana')
      await screen.findByRole('list', { name: 'Matching places' })

      search('')

      await waitFor(() =>
        expect(
          screen.queryByRole('list', { name: 'Matching places' }),
        ).toBeNull(),
      )
    })

    test('shows the answer to what was typed last, not to an earlier slower search', async () => {
      let answerSlow: (places: Place[]) => void = () => {}
      vi.mocked(searchPlaces)
        .mockImplementationOnce(
          () => new Promise((resolve) => (answerSlow = resolve)),
        )
        .mockResolvedValueOnce([hooker])
      renderPage()

      search('wa')
      search('hooker')
      await screen.findByText('Hooker Hut')
      await act(async () => answerSlow([wanaka]))

      expect(screen.getByText('Hooker Hut')).toBeInTheDocument()
      expect(screen.queryByText('Wanaka')).toBeNull()
    })
  })

  describe('the keyboard', () => {
    const key = (el: Element, name: string) =>
      fireEvent.keyDown(el, { key: name })

    test('Arrow Down from the box goes to the first match, then down the matches', async () => {
      vi.mocked(searchPlaces).mockResolvedValue([wanaka, lakeWanaka])
      renderPage()
      search('wana')
      const box = screen.getByLabelText('Add a place')
      await screen.findByRole('list', { name: 'Matching places' })

      key(box, 'ArrowDown')
      expect(screen.getByRole('button', { name: /^Wanaka/ })).toHaveFocus()

      key(document.activeElement!, 'ArrowDown')
      expect(screen.getByRole('button', { name: /Lake Wanaka/ })).toHaveFocus()

      key(document.activeElement!, 'ArrowDown')
      expect(screen.getByRole('button', { name: /Lake Wanaka/ })).toHaveFocus()
    })

    test('Arrow Up goes back up, and from the first match to the box', async () => {
      vi.mocked(searchPlaces).mockResolvedValue([wanaka, lakeWanaka])
      renderPage()
      search('wana')
      const box = screen.getByLabelText('Add a place')
      await screen.findByRole('list', { name: 'Matching places' })
      key(box, 'ArrowDown')
      key(document.activeElement!, 'ArrowDown')

      key(document.activeElement!, 'ArrowUp')
      expect(screen.getByRole('button', { name: /^Wanaka/ })).toHaveFocus()

      key(document.activeElement!, 'ArrowUp')
      expect(box).toHaveFocus()
    })

    test('skips a place that is already pinned', async () => {
      vi.mocked(searchPlaces).mockResolvedValue([wanaka, lakeWanaka])
      renderPage([pinFromPlace(wanaka)])
      search('wana')
      await screen.findByRole('list', { name: 'Matching places' })

      key(screen.getByLabelText('Add a place'), 'ArrowDown')

      expect(screen.getByRole('button', { name: /Lake Wanaka/ })).toHaveFocus()
    })

    test('Enter on a match pins it', async () => {
      vi.mocked(searchPlaces).mockResolvedValue([wanaka])
      const { store } = renderPage()
      search('wana')
      await screen.findByRole('list', { name: 'Matching places' })
      key(screen.getByLabelText('Add a place'), 'ArrowDown')

      // A focused button is activated by Enter; the browser turns that into a click.
      fireEvent.click(document.activeElement!)

      expect(stored(store)).toHaveLength(1)
    })
  })

  describe('pinning', () => {
    test('tapping a match pins it at once, with the place’s own name', async () => {
      vi.mocked(searchPlaces).mockResolvedValue([wanaka])
      const { store } = renderPage()
      search('wana')

      fireEvent.click(await screen.findByRole('button', { name: /Wanaka/ }))

      expect(stored(store)).toHaveLength(1)
      expect(stored(store)[0]).toMatchObject({
        name: 'Wanaka',
        context: 'Otago',
        kind: 'Town',
        latitude: -44.703,
        longitude: 169.132,
      })
      expect(stored(store)[0].label).toBeUndefined()
    })

    test('clears the search, says it is pinned, and shows it in the list', async () => {
      vi.mocked(searchPlaces).mockResolvedValue([wanaka])
      renderPage()
      search('wana')

      fireEvent.click(await screen.findByRole('button', { name: /Wanaka/ }))

      expect(screen.getByLabelText('Add a place')).toHaveValue('')
      expect(screen.getByRole('status')).toHaveTextContent('Pinned Wanaka')
      expect(screen.getByLabelText('Add a place')).toHaveFocus()
      const row = screen.getByText('Your pins').nextElementSibling!
      expect(row).toHaveTextContent('Wanaka')
      expect(screen.queryByText(/No pins yet/)).toBeNull()
    })

    test('shows a place that is already pinned as pinned, and cannot be pinned again', async () => {
      vi.mocked(searchPlaces).mockResolvedValue([wanaka])
      const { store } = renderPage([pinFromPlace(wanaka)])
      search('wana')

      const match = await screen.findByRole('button', {
        name: /Wanaka.*Pinned/s,
      })

      expect(match).toBeDisabled()
      fireEvent.click(match)
      expect(stored(store)).toHaveLength(1)
    })
  })

  describe('the pins', () => {
    test('lists each with its full name, what it is and where', () => {
      renderPage([pinFromPlace(wanaka), pinFromPlace(hooker)])

      const rows = within(
        screen.getByText('Your pins').nextElementSibling as HTMLElement,
      ).getAllByRole('listitem')
      expect(rows).toHaveLength(2)
      expect(rows[0]).toHaveTextContent('Wanaka')
      expect(rows[0]).toHaveTextContent('Town · Otago')
      expect(rows[1]).toHaveTextContent('Hooker Hut')
    })

    test('says which charts show a pin, each a link to that chart', () => {
      renderPage([pinFromPlace(wanaka)])

      expect(
        screen.getByRole('link', { name: 'South Island' }),
      ).toHaveAttribute('href', '/regions/nzsi')
      expect(screen.getByRole('link', { name: 'New Zealand' })).toHaveAttribute(
        'href',
        '/regions/nz',
      )
      expect(screen.getByRole('link', { name: 'World' })).toHaveAttribute(
        'href',
        '/regions/world',
      )
      expect(screen.queryByRole('link', { name: 'Europe' })).toBeNull()
    })

    test('says so when no chart shows a place', () => {
      renderPage([
        pinFromPlace({
          ...wanaka,
          name: 'North Pole',
          latitude: 89,
          longitude: 0,
        }),
      ])

      expect(screen.getByText('No chart shows this place.')).toBeInTheDocument()
    })

    test('removes a pin, named so it is clear which', () => {
      const { store } = renderPage([pinFromPlace(wanaka), pinFromPlace(hooker)])

      fireEvent.click(screen.getByRole('button', { name: 'Remove Wanaka' }))

      expect(stored(store).map((pin) => pin.name)).toEqual(['Hooker Hut'])
    })

    test('goes back to saying how to pin when the last is removed', () => {
      renderPage([pinFromPlace(wanaka)])

      fireEvent.click(screen.getByRole('button', { name: 'Remove Wanaka' }))

      expect(screen.getByText(/No pins yet/)).toBeInTheDocument()
    })
  })

  describe('labelling', () => {
    const open = (name = 'Wanaka') =>
      fireEvent.click(screen.getByRole('button', { name: `Label ${name}` }))
    const field = () => screen.getByLabelText(/Label for Wanaka on the charts/)

    test('opens a field for the label, which starts empty for a pin without one', () => {
      renderPage([pinFromPlace(wanaka)])

      open()

      expect(field()).toHaveValue('')
      expect(field()).toHaveFocus()
    })

    test('starts with the current label, if there is one', () => {
      renderPage([{ ...pinFromPlace(wanaka), label: 'Home' }])

      open()

      expect(field()).toHaveValue('Home')
    })

    test('saves what was typed as the label, shown beside the name', () => {
      const { store } = renderPage([pinFromPlace(wanaka)])
      open()

      fireEvent.change(field(), { target: { value: 'Home' } })
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))

      expect(stored(store)[0].label).toBe('Home')
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.queryByLabelText(/Label for Wanaka/)).toBeNull()
    })

    test('saves with Enter', () => {
      const { store } = renderPage([pinFromPlace(wanaka)])
      open()

      fireEvent.change(field(), { target: { value: 'Camp' } })
      fireEvent.submit(field().closest('form')!)

      expect(stored(store)[0].label).toBe('Camp')
    })

    test('does not let a label be longer than a chart has room for', () => {
      renderPage([pinFromPlace(wanaka)])
      open()

      expect(field()).toHaveAttribute('maxLength', '20')
    })

    test('clears the label when saved blank, going back to the name', () => {
      const { store } = renderPage([{ ...pinFromPlace(wanaka), label: 'Home' }])
      open()

      fireEvent.change(field(), { target: { value: '   ' } })
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))

      expect(stored(store)[0].label).toBeUndefined()
    })

    test('cancels without changing anything', () => {
      const { store } = renderPage([{ ...pinFromPlace(wanaka), label: 'Home' }])
      open()

      fireEvent.change(field(), { target: { value: 'Other' } })
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(stored(store)[0].label).toBe('Home')
      expect(screen.queryByLabelText(/Label for Wanaka/)).toBeNull()
    })

    test('cancels with Escape', () => {
      const { store } = renderPage([pinFromPlace(wanaka)])
      open()

      fireEvent.change(field(), { target: { value: 'Other' } })
      fireEvent.keyDown(field(), { key: 'Escape' })

      expect(stored(store)[0].label).toBeUndefined()
      expect(screen.queryByLabelText(/Label for Wanaka/)).toBeNull()
    })

    test('the button says whether the field is open', () => {
      renderPage([pinFromPlace(wanaka)])
      const button = screen.getByRole('button', { name: 'Label Wanaka' })
      expect(button).toHaveAttribute('aria-expanded', 'false')

      fireEvent.click(button)

      expect(button).toHaveAttribute('aria-expanded', 'true')
    })

    test('opening one pin’s label does not open another’s', () => {
      renderPage([pinFromPlace(wanaka), pinFromPlace(hooker)])

      open()

      expect(screen.queryByLabelText(/Label for Hooker Hut/)).toBeNull()
    })
  })
})
