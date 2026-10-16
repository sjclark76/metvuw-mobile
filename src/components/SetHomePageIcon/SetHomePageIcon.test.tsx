import { fireEvent, render, screen } from '@testing-library/react'
import { createStore, Provider } from 'jotai'
import { usePathname } from 'next/navigation'

import SetHomePageIcon from './SetHomePageIcon'

vi.mock('next/navigation', () => ({ usePathname: vi.fn() }))

const renderIcon = () =>
  render(
    <Provider store={createStore()}>
      <SetHomePageIcon />
    </Provider>,
  )

const toggle = () =>
  screen.getByRole('button', { name: 'Use this page as my home page' })

describe('<SetHomePageIcon />', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(usePathname).mockReturnValue('/regions/nz')
  })

  // It was a button with only a tooltip (title) and no state, so it had no
  // reliable accessible name and never said whether it was on.
  test('is a named toggle that reports whether this page is the home page', () => {
    renderIcon()
    expect(toggle()).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(toggle())

    expect(toggle()).toHaveAttribute('aria-pressed', 'true')
    expect(JSON.parse(localStorage.getItem('favoritePage')!)).toBe(
      '/regions/nz',
    )

    fireEvent.click(toggle())

    expect(toggle()).toHaveAttribute('aria-pressed', 'false')
    expect(JSON.parse(localStorage.getItem('favoritePage')!)).toBeNull()
  })

  test('is not pressed on a page that is not the home page', () => {
    localStorage.setItem('favoritePage', JSON.stringify('/satellite'))
    renderIcon()

    expect(toggle()).toHaveAttribute('aria-pressed', 'false')
  })

  test('keeps the tooltip', () => {
    renderIcon()

    expect(toggle()).toHaveAttribute('title', 'Set as home page')
  })
})
