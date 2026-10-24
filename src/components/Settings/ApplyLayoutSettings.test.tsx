import { act, render } from '@testing-library/react'
import { createStore, Provider } from 'jotai'

import {
  pinsAtom,
  showHeavyRainAtom,
  showSliderAtom,
  showViewerAtom,
} from '@/components/Atoms/GlobalState'
import { pinFromPlace } from '@/shared/helpers/pins/pins'

import { ApplyLayoutSettings } from './ApplyLayoutSettings'

const root = document.documentElement

function renderIt() {
  const store = createStore()
  render(
    <Provider store={store}>
      <ApplyLayoutSettings />
    </Provider>,
  )
  return store
}

describe('<ApplyLayoutSettings />', () => {
  beforeEach(() => {
    localStorage.clear()
    root.removeAttribute('data-hide-viewer')
    root.removeAttribute('data-hide-slider')
    root.removeAttribute('data-hide-heavy-rain')
    root.removeAttribute('data-has-pins')
  })

  test('hides nothing while both are on', () => {
    renderIt()

    expect(root).not.toHaveAttribute('data-hide-viewer')
    expect(root).not.toHaveAttribute('data-hide-slider')
  })

  test('hides the viewer the moment it is turned off, and shows it when it is turned on', () => {
    const store = renderIt()

    act(() => store.set(showViewerAtom, false))
    expect(root).toHaveAttribute('data-hide-viewer')

    act(() => store.set(showViewerAtom, true))
    expect(root).not.toHaveAttribute('data-hide-viewer')
  })

  test('hides the slider the moment it is turned off, and shows it when it is turned on', () => {
    const store = renderIt()

    act(() => store.set(showSliderAtom, false))
    expect(root).toHaveAttribute('data-hide-slider')

    act(() => store.set(showSliderAtom, true))
    expect(root).not.toHaveAttribute('data-hide-slider')
  })

  test('treats the two on their own', () => {
    const store = renderIt()

    act(() => store.set(showSliderAtom, false))

    expect(root).toHaveAttribute('data-hide-slider')
    expect(root).not.toHaveAttribute('data-hide-viewer')
  })

  test('hides what was already turned off when the app opens', () => {
    localStorage.setItem('showViewer', 'false')

    renderIt()

    expect(root).toHaveAttribute('data-hide-viewer')
  })

  test('hides the heavy rain note when it is turned off, and shows it when it is turned on', () => {
    const store = renderIt()

    act(() => store.set(showHeavyRainAtom, false))
    expect(root).toHaveAttribute('data-hide-heavy-rain')

    act(() => store.set(showHeavyRainAtom, true))
    expect(root).not.toHaveAttribute('data-hide-heavy-rain')
  })

  test('says there are pins as soon as there is one, and not when there are none', () => {
    const store = renderIt()
    expect(root).not.toHaveAttribute('data-has-pins')

    act(() =>
      store.set(pinsAtom, [
        pinFromPlace({
          name: 'Wanaka',
          context: 'Otago',
          kind: 'Town',
          latitude: -44.7,
          longitude: 169.1,
        }),
      ]),
    )
    expect(root).toHaveAttribute('data-has-pins')

    act(() => store.set(pinsAtom, []))
    expect(root).not.toHaveAttribute('data-has-pins')
  })
})
