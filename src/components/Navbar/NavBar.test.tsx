import { fireEvent, render, screen } from '@testing-library/react'
import { createStore, Provider } from 'jotai'

import { savedPagesAtom } from '@/components/Atoms/GlobalState'

import Navbar from './NavBar'

vi.mock('next/navigation', () => ({ usePathname: vi.fn(() => '/') }))

const renderNavbar = () =>
  render(
    <Provider store={createStore()}>
      <Navbar />
    </Provider>,
  )

const menuButton = () => screen.getByRole('button', { name: 'Menu' })

describe('<Navbar /> menu button', () => {
  // It had a static "Open Menu" label and no state, so a screen reader user was
  // never told whether the menu was open or what the button controlled.
  test('keeps one name and reports whether the menu is open', () => {
    renderNavbar()
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(menuButton())

    expect(menuButton()).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(menuButton())
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false')
  })

  test('controls the panel that holds the navigation', () => {
    renderNavbar()

    const panel = document.getElementById(
      menuButton().getAttribute('aria-controls')!,
    )

    expect(panel).toBeInTheDocument()
    expect(panel!.querySelectorAll('button[aria-controls]')).toHaveLength(8)
  })

  // 24px icon + padding must reach the 44px minimum touch target.
  test('has room around the icon for a 44px touch target', () => {
    renderNavbar()

    expect(menuButton().className).toMatch(/\bp-3\b/)
  })
})

describe('<Navbar /> closing the menu', () => {
  const panel = () => document.getElementById('site-menu')!

  test('starts closed', () => {
    renderNavbar()

    expect(panel()).toHaveClass('hidden')
  })

  test('opens and closes the panel with the button', () => {
    renderNavbar()

    fireEvent.click(menuButton())
    expect(panel()).not.toHaveClass('hidden')

    fireEvent.click(menuButton())
    expect(panel()).toHaveClass('hidden')
  })

  test('closes when the visitor presses anywhere outside it', () => {
    renderNavbar()
    fireEvent.click(menuButton())

    fireEvent.mouseDown(document.body)

    expect(menuButton()).toHaveAttribute('aria-expanded', 'false')
  })

  test('stays open for a press inside it', () => {
    renderNavbar()
    fireEvent.click(menuButton())

    fireEvent.mouseDown(panel())

    expect(menuButton()).toHaveAttribute('aria-expanded', 'true')
  })

  test('closes after choosing the Satellite page', () => {
    renderNavbar()
    fireEvent.click(menuButton())

    fireEvent.click(screen.getByRole('link', { name: 'Satellite' }))

    expect(menuButton()).toHaveAttribute('aria-expanded', 'false')
  })

  test('does not listen for outside presses while the menu is closed', () => {
    const add = vi.spyOn(document, 'addEventListener')
    renderNavbar()

    expect(
      add.mock.calls.filter(([type]) => type === 'mousedown'),
    ).toHaveLength(0)
    add.mockRestore()
  })

  test('links to the contact address and the home page', () => {
    renderNavbar()

    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'href',
      'mailto:metvuwmobile@gmail.com',
    )
    expect(
      screen.getByRole('link', { name: /metvuw mobile/i }),
    ).toHaveAttribute('href', '/')
  })
})

describe('<Navbar /> saved pages', () => {
  const saved = (path: string) => ({
    path,
    title: path,
    issued: 1,
    refreshedAt: 1,
    urls: ['/api/fallback-image?url=a'],
    bytes: 1,
  })
  const renderWithSaved = (...paths: string[]) => {
    const store = createStore()
    store.set(savedPagesAtom, paths.map(saved))
    return render(
      <Provider store={store}>
        <Navbar />
      </Provider>,
    )
  }

  test('says how many pages are saved on the Saved link', () => {
    renderWithSaved('/regions/nz', '/satellite', '/radar/nl')

    expect(screen.getByRole('link', { name: 'Saved (3)' })).toHaveAttribute(
      'href',
      '/saved',
    )
  })

  test('counts pages, not their addresses: the home page is New Zealand', () => {
    const store = createStore()
    store.set(savedPagesAtom, [
      { ...saved('/regions/nz'), aliases: ['/'] },
      saved('/satellite'),
    ])
    render(
      <Provider store={store}>
        <Navbar />
      </Provider>,
    )

    expect(screen.getByRole('link', { name: 'Saved (2)' })).toBeInTheDocument()
  })

  test('shows no count when nothing is saved', () => {
    renderWithSaved()

    expect(screen.getByRole('link', { name: 'Saved' })).toBeInTheDocument()
  })

  test('marks the Satellite link when it is saved', () => {
    renderWithSaved('/satellite')

    expect(
      screen.getByRole('link', { name: 'Satellite Saved for offline' }),
    ).toBeInTheDocument()
  })

  test('does not mark the Satellite link when it is not', () => {
    renderWithSaved('/regions/nz')

    expect(screen.getByRole('link', { name: 'Satellite' })).toBeInTheDocument()
  })
})
