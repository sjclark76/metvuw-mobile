import { fireEvent, render, screen } from '@testing-library/react'
import { createStore, Provider } from 'jotai'

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
