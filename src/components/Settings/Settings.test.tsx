import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { createStore, Provider } from 'jotai'

import {
  favoritePageAtom,
  pinsAtom,
  savedPagesAtom,
  showHeavyRainAtom,
  showSliderAtom,
  showViewerAtom,
  themeAtom,
} from '@/components/Atoms/GlobalState'
import { pinFromPlace } from '@/shared/helpers/pins/pins'

import { homePageGroups } from './homePageOptions'
import { SettingsPage } from './SettingsPage'
import { ToggleRow } from './ToggleRow'

vi.mock('@/components/SavedPages/browserDependencies', () => ({
  browserDependencies: () => ({}),
  supportsSavingPages: () => true,
}))
vi.mock('@/shared/helpers/offline/savedPages', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/shared/helpers/offline/savedPages')
  >()),
  collectGarbage: vi.fn().mockResolvedValue(undefined),
}))

const wanaka = pinFromPlace({
  name: 'Wanaka',
  context: 'Otago',
  kind: 'Town',
  latitude: -44.703,
  longitude: 169.132,
})
const savedPage = {
  path: '/regions/nz',
  title: 'New Zealand',
  issued: 1,
  refreshedAt: 1,
  urls: [],
  bytes: 10,
}

const renderPage = (
  setup?: (store: ReturnType<typeof createStore>) => void,
) => {
  const store = createStore()
  setup?.(store)
  const view = render(
    <Provider store={store}>
      <SettingsPage />
    </Provider>,
  )
  return { store, ...view }
}

describe('the pages that can be the home page', () => {
  test('lists each page once, however many of the menu’s groups it is in', () => {
    const paths = homePageGroups.flatMap((group) =>
      group.options.map((option) => option.path),
    )

    expect(new Set(paths).size).toBe(paths.length)
    expect(paths).toContain('/regions/fiji')
    expect(paths).toContain('/regions/natlantic')
  })
})

describe('<ToggleRow />', () => {
  test('is a switch with a name and a description, and says whether it is on', () => {
    render(
      <ToggleRow
        label="Show it"
        description="What it does."
        checked
        onChange={() => {}}
      />,
    )

    const toggle = screen.getByRole('switch', { name: 'Show it' })
    expect(toggle).toBeChecked()
    expect(toggle).toHaveAccessibleDescription('What it does.')
  })

  test('asks for the opposite when pressed', () => {
    const onChange = vi.fn()
    render(
      <ToggleRow label="Show it" description="" checked onChange={onChange} />,
    )

    fireEvent.click(screen.getByRole('switch'))

    expect(onChange).toHaveBeenCalledWith(false)
  })
})

describe('<SettingsPage />', () => {
  beforeEach(() => {
    // The choices are saved in localStorage, which the tests would share.
    localStorage.clear()
    window.gtag = vi.fn()
  })
  afterEach(() => {
    delete window.gtag
  })

  describe('warnings', () => {
    test('has heavy rain warnings on until they are turned off, and counts it', () => {
      const { store } = renderPage()
      const toggle = screen.getByRole('switch', {
        name: 'Show heavy rain warnings',
      })

      expect(toggle).toBeChecked()
      fireEvent.click(toggle)

      expect(store.get(showHeavyRainAtom)).toBe(false)
      expect(window.gtag).toHaveBeenCalledWith('event', 'setting_changed', {
        setting: 'heavy_rain',
        value: false,
      })
    })
  })

  describe('the footer', () => {
    test('has both switches on until they are turned off', () => {
      renderPage()

      expect(
        screen.getByRole('switch', { name: 'Show the animated viewer' }),
      ).toBeChecked()
      expect(
        screen.getByRole('switch', { name: 'Show the time slider' }),
      ).toBeChecked()
    })

    test('turns the viewer off, and counts it', () => {
      const { store } = renderPage()

      fireEvent.click(
        screen.getByRole('switch', { name: 'Show the animated viewer' }),
      )

      expect(store.get(showViewerAtom)).toBe(false)
      expect(window.gtag).toHaveBeenCalledWith('event', 'setting_changed', {
        setting: 'viewer',
        value: false,
      })
    })

    test('turns the slider off, and says it takes the rain strip too', () => {
      const { store } = renderPage()

      expect(
        screen.getByText(/Hiding the slider also hides the rain strip/),
      ).toBeInTheDocument()
      fireEvent.click(
        screen.getByRole('switch', { name: 'Show the time slider' }),
      )

      expect(store.get(showSliderAtom)).toBe(false)
      expect(window.gtag).toHaveBeenCalledWith('event', 'setting_changed', {
        setting: 'slider',
        value: false,
      })
    })

    test('says the footer goes when both are off', () => {
      renderPage((store) => {
        store.set(showViewerAtom, false)
        store.set(showSliderAtom, false)
      })

      expect(
        screen.getByText(/the footer is not shown at all/),
      ).toBeInTheDocument()
    })

    test('shows each as it was left', () => {
      renderPage((store) => store.set(showSliderAtom, false))

      expect(
        screen.getByRole('switch', { name: 'Show the animated viewer' }),
      ).toBeChecked()
      expect(
        screen.getByRole('switch', { name: 'Show the time slider' }),
      ).not.toBeChecked()
    })
  })

  describe('the home page', () => {
    const select = () => screen.getByLabelText('Home page') as HTMLSelectElement

    test('is the default until another is chosen', () => {
      renderPage()

      expect(select().value).toBe('')
      expect(
        within(select()).getByRole('option', { name: 'New Zealand (default)' }),
      ).toBeInTheDocument()
    })

    test('lists the pages by kind, and keeps the choice where the navigation does', () => {
      const { store } = renderPage()

      fireEvent.change(select(), { target: { value: '/regions/nzsi' } })

      expect(store.get(favoritePageAtom)).toBe('/regions/nzsi')
      expect(
        within(select()).getByRole('group', { name: 'Radar' }),
      ).toBeInTheDocument()
      expect(
        within(select()).getByRole('group', { name: 'Upper air' }),
      ).toBeInTheDocument()
    })

    test('shows the page already chosen with the home button in the navigation', () => {
      renderPage((store) => store.set(favoritePageAtom, '/radar/nl'))

      expect(select().value).toBe('/radar/nl')
    })

    test('goes back to the default when that is chosen', () => {
      const { store } = renderPage((s) => s.set(favoritePageAtom, '/radar/nl'))

      fireEvent.change(select(), { target: { value: '' } })

      expect(store.get(favoritePageAtom)).toBeNull()
    })

    test('shows a saved page that is not one of the choices as the default', () => {
      renderPage((store) => store.set(favoritePageAtom, '/'))

      expect(select().value).toBe('')
    })
  })

  describe('the theme', () => {
    test('shows the current choice, and changes it', () => {
      const { store } = renderPage((s) => s.set(themeAtom, 'dark'))
      expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )

      fireEvent.click(screen.getByRole('button', { name: 'Light' }))

      expect(store.get(themeAtom)).toBe('light')
      expect(window.gtag).toHaveBeenCalledWith('event', 'theme_changed', {
        theme: 'light',
      })
    })

    test('starts on system', () => {
      renderPage()

      expect(screen.getByRole('button', { name: 'System' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    })
  })

  describe('the data on this device', () => {
    test('says there are no places and no saved pages, and offers nothing to clear', () => {
      renderPage()

      expect(screen.getByText('No places.')).toBeInTheDocument()
      expect(screen.getByText('No saved pages.')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Clear all places' }),
      ).toBeDisabled()
      expect(
        screen.getByRole('button', { name: 'Clear all saved pages' }),
      ).toBeDisabled()
    })

    test('counts the places and links to them', () => {
      renderPage((store) => store.set(pinsAtom, [wanaka]))

      expect(screen.getByText(/1 place on this device/)).toBeInTheDocument()
      expect(
        screen.getAllByRole('link', { name: 'See them' })[0],
      ).toHaveAttribute('href', '/pins')
    })

    test('asks before clearing the places, and clears them when told to', async () => {
      const { store } = renderPage((s) => s.set(pinsAtom, [wanaka]))

      fireEvent.click(screen.getByRole('button', { name: 'Clear all places' }))
      expect(
        screen.getByRole('alertdialog', { name: /Clear 1 place\?/ }),
      ).toBeInTheDocument()
      expect(store.get(pinsAtom)).toHaveLength(1)

      await act(async () =>
        fireEvent.click(screen.getByRole('button', { name: 'Yes, clear' })),
      )

      expect(store.get(pinsAtom)).toEqual([])
      expect(screen.queryByRole('alertdialog')).toBeNull()
    })

    test('keeps the places when told not to clear them', () => {
      const { store } = renderPage((s) => s.set(pinsAtom, [wanaka]))

      fireEvent.click(screen.getByRole('button', { name: 'Clear all places' }))
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(store.get(pinsAtom)).toHaveLength(1)
      expect(screen.queryByRole('alertdialog')).toBeNull()
    })

    test('clears the saved pages, after asking', async () => {
      const { store } = renderPage((s) => s.set(savedPagesAtom, [savedPage]))
      expect(
        screen.getByText(/1 page saved on this device/),
      ).toBeInTheDocument()

      fireEvent.click(
        screen.getByRole('button', { name: 'Clear all saved pages' }),
      )
      expect(
        screen.getByRole('alertdialog', { name: /will not open offline/ }),
      ).toBeInTheDocument()
      await act(async () =>
        fireEvent.click(screen.getByRole('button', { name: 'Yes, clear' })),
      )

      expect(store.get(savedPagesAtom)).toEqual([])
    })
  })
})
