import { act, screen, waitFor } from '@testing-library/react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'

import { type Place, searchPlaces } from '@/shared/helpers/places'

import { PlaceSearch } from './PlaceSearch'

vi.mock('@/shared/helpers/places', () => ({
  searchPlaces: vi.fn(),
  PLACES_ATTRIBUTION: 'Place names: GeoNames, CC BY 4.0',
}))

const wanaka: Place = {
  name: 'Wanaka',
  context: 'Otago',
  kind: 'Town',
  latitude: -44.703,
  longitude: 169.132,
}

// The page is drawn on the server and reaches the phone before its script has run.
// Someone quick can type in the box in that gap, and what they typed must not be lost
// when the page comes alive: on a slow phone that is easily the first thing they do.
describe('<PlaceSearch /> before the page has come alive', () => {
  test('keeps what was typed, and searches for it', async () => {
    vi.mocked(searchPlaces).mockResolvedValue([wanaka])
    const container = document.createElement('div')
    document.body.append(container)
    container.innerHTML = renderToString(
      <PlaceSearch pinned={new Set()} onPick={() => {}} />,
    )
    const box = container.querySelector('input')!
    box.value = 'wana'

    await act(async () => {
      hydrateRoot(
        container,
        <PlaceSearch pinned={new Set()} onPick={() => {}} />,
      )
    })

    expect(screen.getByLabelText('Add a place')).toHaveValue('wana')
    await waitFor(() => expect(searchPlaces).toHaveBeenCalledWith('wana'))
    expect(await screen.findByText('Wanaka')).toBeInTheDocument()
    container.remove()
  })
})
