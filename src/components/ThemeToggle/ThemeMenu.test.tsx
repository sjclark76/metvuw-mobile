import { fireEvent, render, screen } from '@testing-library/react'
import { createStore, Provider } from 'jotai'

import { ThemeMenu } from './ThemeMenu'

const renderMenu = () =>
  render(
    <Provider store={createStore()}>
      <ThemeMenu />
    </Provider>,
  )

const button = () => screen.getByRole('button', { name: /^Theme/ })
const option = (name: 'System' | 'Light' | 'Dark') =>
  screen.getByRole('button', { name })
const open = () => fireEvent.click(button())
const choose = (name: 'System' | 'Light' | 'Dark') => {
  open()
  fireEvent.click(option(name))
}
const applied = () => document.documentElement.getAttribute('data-theme')
const saved = () => JSON.parse(localStorage.getItem('theme') ?? 'null')

describe('<ThemeMenu />', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  describe('the three choices', () => {
    test('offers system, light and dark', () => {
      renderMenu()
      open()

      expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(
        expect.arrayContaining(['System', 'Light', 'Dark']),
      )
    })

    test('starts on system, which forces nothing on the page', () => {
      renderMenu()
      open()

      expect(option('System')).toHaveAttribute('aria-pressed', 'true')
      expect(option('Light')).toHaveAttribute('aria-pressed', 'false')
      expect(option('Dark')).toHaveAttribute('aria-pressed', 'false')
      expect(applied()).toBeNull()
    })

    test.each(['Light', 'Dark'] as const)('%s forces that theme', (name) => {
      renderMenu()

      choose(name)

      expect(applied()).toBe(name.toLowerCase())
    })

    test('system hands the page back to the system setting', () => {
      renderMenu()
      choose('Dark')

      choose('System')

      expect(applied()).toBeNull()
    })

    test('only the chosen one is pressed', () => {
      renderMenu()

      choose('Light')
      open()

      expect(option('Light')).toHaveAttribute('aria-pressed', 'true')
      expect(option('System')).toHaveAttribute('aria-pressed', 'false')
      expect(option('Dark')).toHaveAttribute('aria-pressed', 'false')
    })
  })

  // Saved the way the favourite page is: through jotai's storage atom.
  describe('remembering', () => {
    test.each(['Light', 'Dark', 'System'] as const)(
      'saves %s as JSON',
      (name) => {
        renderMenu()

        choose(name)

        expect(saved()).toBe(name.toLowerCase())
      },
    )

    test('picks up a saved choice on the first render', () => {
      localStorage.setItem('theme', JSON.stringify('dark'))

      renderMenu()
      open()

      expect(option('Dark')).toHaveAttribute('aria-pressed', 'true')
      expect(applied()).toBe('dark')
    })

    test('treats an unknown saved value as system', () => {
      localStorage.setItem('theme', JSON.stringify('purple'))

      renderMenu()
      open()

      expect(option('System')).toHaveAttribute('aria-pressed', 'true')
      expect(applied()).toBeNull()
    })

    test('still changes the theme when storage is blocked', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('storage is blocked')
      })
      renderMenu()

      expect(() => choose('Dark')).not.toThrow()
      expect(applied()).toBe('dark')
      vi.restoreAllMocks()
    })
  })

  describe('the button', () => {
    test('says which choice is current', () => {
      renderMenu()
      expect(button()).toHaveAccessibleName('Theme: System')

      choose('Dark')

      expect(button()).toHaveAccessibleName('Theme: Dark')
    })

    test('draws a different icon for each choice, hidden from assistive technology', () => {
      const { container } = renderMenu()
      const icons = new Set<string>()
      for (const name of ['System', 'Light', 'Dark'] as const) {
        choose(name)
        const svg = button().querySelector('svg')!
        expect(svg).toHaveAttribute('aria-hidden', 'true')
        icons.add(svg.innerHTML)
      }

      expect(icons.size).toBe(3)
      expect(container).toBeTruthy()
    })

    test('is large enough to touch', () => {
      renderMenu()

      expect(button().className).toMatch(/\bp-2\.5\b/)
    })
  })

  describe('opening and closing', () => {
    test('is closed to begin with, and its choices are not reachable', () => {
      renderMenu()

      expect(button()).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByRole('button', { name: 'Dark' })).toBeNull()
    })

    test('opens and closes with the button', () => {
      renderMenu()

      open()
      expect(button()).toHaveAttribute('aria-expanded', 'true')
      expect(option('Dark')).toBeInTheDocument()

      fireEvent.click(button())
      expect(button()).toHaveAttribute('aria-expanded', 'false')
    })

    test('the button controls the list', () => {
      renderMenu()
      open()

      const list = document.getElementById(
        button().getAttribute('aria-controls')!,
      )

      expect(list).toContainElement(option('Light'))
    })

    test('closes after a choice is made, and focus goes back to the button', () => {
      renderMenu()
      open()
      option('Dark').focus()

      fireEvent.click(option('Dark'))

      expect(button()).toHaveAttribute('aria-expanded', 'false')
      expect(button()).toHaveFocus()
    })

    test('Escape closes it and returns focus to the button', () => {
      renderMenu()
      open()
      option('Light').focus()

      fireEvent.keyDown(option('Light'), { key: 'Escape' })

      expect(button()).toHaveAttribute('aria-expanded', 'false')
      expect(button()).toHaveFocus()
    })

    test('a press outside closes it', () => {
      renderMenu()
      open()

      fireEvent.mouseDown(document.body)

      expect(button()).toHaveAttribute('aria-expanded', 'false')
    })

    test('a press inside does not close it', () => {
      renderMenu()
      open()

      fireEvent.mouseDown(option('Light'))

      expect(button()).toHaveAttribute('aria-expanded', 'true')
    })

    test('tabbing out of it closes it', () => {
      render(
        <Provider store={createStore()}>
          <ThemeMenu />
          <button>elsewhere</button>
        </Provider>,
      )
      open()
      option('Dark').focus()

      fireEvent.blur(option('Dark'), {
        relatedTarget: screen.getByRole('button', { name: 'elsewhere' }),
      })

      expect(button()).toHaveAttribute('aria-expanded', 'false')
    })

    test('moving focus within it keeps it open', () => {
      renderMenu()
      open()

      fireEvent.blur(option('Light'), { relatedTarget: option('Dark') })

      expect(button()).toHaveAttribute('aria-expanded', 'true')
    })

    // Safari does not focus a button on click, so a blur with no new target
    // happens when the button itself is pressed; closing then would reopen it.
    test('a blur with no new target does not close it', () => {
      renderMenu()
      open()

      fireEvent.blur(option('Light'), { relatedTarget: null })

      expect(button()).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('counting', () => {
    afterEach(() => {
      delete window.gtag
    })

    test('counts a change of theme, with the theme chosen', () => {
      window.gtag = vi.fn()
      renderMenu()
      open()

      fireEvent.click(option('Dark'))

      expect(window.gtag).toHaveBeenCalledWith('event', 'theme_changed', {
        theme: 'dark',
      })
    })
  })
})
