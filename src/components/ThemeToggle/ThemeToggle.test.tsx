import { act, fireEvent, render, screen } from '@testing-library/react'

import { ThemeToggle } from './ThemeToggle'

function stubSystemTheme(dark: boolean) {
  const listeners = new Set<() => void>()
  const query = {
    matches: dark,
    addEventListener: (_: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) =>
      listeners.delete(listener),
  }
  vi.stubGlobal('matchMedia', () => query)
  return {
    change(nowDark: boolean) {
      query.matches = nowDark
      listeners.forEach((listener) => listener())
    },
  }
}

const toggle = () => screen.getByRole('button', { name: 'Dark mode' })
const chosen = () => document.documentElement.getAttribute('data-theme')

describe('<ThemeToggle />', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('following the system', () => {
    test('is off when the system is light', () => {
      stubSystemTheme(false)
      render(<ThemeToggle />)

      expect(toggle()).toHaveAttribute('aria-pressed', 'false')
    })

    test('is on when the system is dark', () => {
      stubSystemTheme(true)
      render(<ThemeToggle />)

      expect(toggle()).toHaveAttribute('aria-pressed', 'true')
    })

    test('follows the system while nothing has been chosen', () => {
      const system = stubSystemTheme(false)
      render(<ThemeToggle />)

      act(() => system.change(true))

      expect(toggle()).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('choosing', () => {
    test('switches a light page to dark, and remembers it', () => {
      stubSystemTheme(false)
      render(<ThemeToggle />)

      fireEvent.click(toggle())

      expect(chosen()).toBe('dark')
      expect(localStorage.getItem('theme')).toBe('dark')
      expect(toggle()).toHaveAttribute('aria-pressed', 'true')
    })

    test('switches a dark page to light, even though the system is dark', () => {
      stubSystemTheme(true)
      render(<ThemeToggle />)

      fireEvent.click(toggle())

      expect(chosen()).toBe('light')
      expect(localStorage.getItem('theme')).toBe('light')
      expect(toggle()).toHaveAttribute('aria-pressed', 'false')
    })

    test('switches back and forth', () => {
      stubSystemTheme(false)
      render(<ThemeToggle />)

      fireEvent.click(toggle())
      fireEvent.click(toggle())

      expect(chosen()).toBe('light')
      expect(toggle()).toHaveAttribute('aria-pressed', 'false')
    })

    test('a saved choice wins over the system, as the page script applied it', () => {
      stubSystemTheme(false)
      document.documentElement.setAttribute('data-theme', 'dark')

      render(<ThemeToggle />)

      expect(toggle()).toHaveAttribute('aria-pressed', 'true')
    })

    test('stops following the system once the visitor has chosen', () => {
      const system = stubSystemTheme(false)
      render(<ThemeToggle />)
      fireEvent.click(toggle())

      act(() => system.change(false))

      expect(chosen()).toBe('dark')
      expect(toggle()).toHaveAttribute('aria-pressed', 'true')
    })

    test('still switches when storage is blocked', () => {
      stubSystemTheme(false)
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('storage is blocked')
      })
      render(<ThemeToggle />)

      expect(() => fireEvent.click(toggle())).not.toThrow()
      expect(chosen()).toBe('dark')
      vi.restoreAllMocks()
    })
  })

  describe('as a control', () => {
    test('is a button with a name and a pressed state', () => {
      stubSystemTheme(false)
      render(<ThemeToggle />)

      expect(toggle()).toHaveAttribute('aria-pressed')
      expect(toggle().className).toMatch(/\bp-2\.5\b/)
    })

    test('draws a different icon for each state, hidden from assistive technology', () => {
      stubSystemTheme(false)
      const { container } = render(<ThemeToggle />)
      const before = container.querySelector('svg')!.innerHTML

      fireEvent.click(toggle())

      expect(container.querySelector('svg')!.innerHTML).not.toBe(before)
      expect(container.querySelector('svg')).toHaveAttribute(
        'aria-hidden',
        'true',
      )
    })

    // jsdom has no matchMedia, and neither do some very old browsers.
    test('does not fail where matchMedia does not exist', () => {
      vi.stubGlobal('matchMedia', undefined)

      expect(() => render(<ThemeToggle />)).not.toThrow()
      expect(toggle()).toHaveAttribute('aria-pressed', 'false')
    })
  })
})
