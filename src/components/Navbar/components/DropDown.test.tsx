import { fireEvent, render, screen } from '@testing-library/react'
import { createStore, Provider } from 'jotai'
import { usePathname } from 'next/navigation'

import { isMenuOpenAtom } from '@/components/Atoms/GlobalState'
import { MenuLink } from '@/components/Navbar/types'

import DropDown from './DropDown'

vi.mock('next/navigation', () => ({ usePathname: vi.fn(() => '/') }))

const links: MenuLink[] = [
  { key: 'nz', value: 'New Zealand', href: '/regions/nz' },
  { key: 'nzni', value: 'North Island', href: '/regions/nzni' },
  { key: 'nzsi', value: 'South Island', href: '/regions/nzsi' },
]

const renderMenu = (store = createStore()) =>
  render(
    <Provider store={store}>
      <DropDown heading="New Zealand" links={links} />
    </Provider>,
  )

const toggle = () => screen.getByRole('button', { name: 'New Zealand' })
const menuLink = (name: string) =>
  screen.getByRole('link', { name, hidden: true })
const open = () => fireEvent.click(toggle())

describe('<DropDown />', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/')
  })

  describe('disclosure semantics', () => {
    test('is closed to begin with, and its links are not reachable', () => {
      renderMenu()

      expect(toggle()).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryAllByRole('link')).toHaveLength(0)
    })

    test('the button controls the list of links', () => {
      renderMenu()

      const list = document.getElementById(
        toggle().getAttribute('aria-controls')!,
      )
      expect(list).toBeInTheDocument()
      expect(list!.querySelectorAll('a')).toHaveLength(3)
    })

    test('opening exposes the links to everyone, in the tab order', () => {
      renderMenu()
      open()

      expect(toggle()).toHaveAttribute('aria-expanded', 'true')
      const names = screen.getAllByRole('link').map((a) => a.textContent)
      expect(names).toEqual(['New Zealand', 'North Island', 'South Island'])
      screen
        .getAllByRole('link')
        .forEach((a) => expect(a).not.toHaveAttribute('tabindex', '-1'))
    })

    test('does not claim to be an ARIA menu, which would promise arrow-key-only behaviour', () => {
      renderMenu()

      expect(toggle()).not.toHaveAttribute('aria-haspopup')
    })

    test('hides the decorative chevron from assistive technology', () => {
      renderMenu()
      const svg = toggle().querySelector('svg')!

      expect(svg).toHaveAttribute('aria-hidden', 'true')
      expect(svg.querySelector('title')).toBeNull()
      expect(toggle()).toHaveAccessibleName('New Zealand')
    })

    test('two menus never share an id', () => {
      render(
        <Provider store={createStore()}>
          <DropDown heading="One" links={links} />
          <DropDown heading="Two" links={links} />
        </Provider>,
      )

      const ids = [...document.querySelectorAll('[id]')].map((e) => e.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    test('marks the link for the current page', () => {
      vi.mocked(usePathname).mockReturnValue('/regions/nzni')
      renderMenu()
      open()

      expect(
        screen.getByRole('link', { name: 'North Island' }),
      ).toHaveAttribute('aria-current', 'page')
      expect(
        screen.getByRole('link', { name: 'New Zealand' }),
      ).not.toHaveAttribute('aria-current')
    })
  })

  describe('mouse', () => {
    // The outside-click check used the list only, so a press on the button
    // counted as "outside": it closed the menu and then the click reopened it.
    test('clicking the button again closes it, and it stays closed', () => {
      renderMenu()
      open()

      fireEvent.mouseDown(toggle())
      fireEvent.click(toggle())

      expect(toggle()).toHaveAttribute('aria-expanded', 'false')
    })

    test('a press outside closes it', () => {
      renderMenu()
      open()

      fireEvent.mouseDown(document.body)

      expect(toggle()).toHaveAttribute('aria-expanded', 'false')
    })

    test('a press inside the list does not close it', () => {
      renderMenu()
      open()

      fireEvent.mouseDown(menuLink('North Island'))

      expect(toggle()).toHaveAttribute('aria-expanded', 'true')
    })

    test('choosing a link closes both the menu and the mobile navigation', () => {
      const store = createStore()
      store.set(isMenuOpenAtom, true)
      renderMenu(store)
      open()

      // Links navigate client-side now, so nothing reloads the page to close them.
      fireEvent.click(screen.getByRole('link', { name: 'South Island' }))

      expect(toggle()).toHaveAttribute('aria-expanded', 'false')
      expect(store.get(isMenuOpenAtom)).toBe(false)
    })

    test('links point at their pages', () => {
      renderMenu()
      open()

      expect(
        screen.getByRole('link', { name: 'North Island' }),
      ).toHaveAttribute('href', '/regions/nzni')
    })
  })

  describe('keyboard', () => {
    // A window keydown handler called preventDefault() for every key while the
    // menu was open, so keyboard users could not Tab out or press Enter.
    test.each(['Tab', 'Enter', ' ', 'Shift'])(
      'does not swallow %j while open',
      (key) => {
        renderMenu()
        open()
        menuLink('North Island').focus()

        const notCancelled = fireEvent.keyDown(menuLink('North Island'), {
          key,
        })

        expect(notCancelled).toBe(true)
      },
    )

    test('Escape closes the menu and returns focus to the button', () => {
      renderMenu()
      open()
      menuLink('North Island').focus()

      fireEvent.keyDown(menuLink('North Island'), { key: 'Escape' })

      expect(toggle()).toHaveAttribute('aria-expanded', 'false')
      expect(toggle()).toHaveFocus()
    })

    test('ArrowDown on the button opens the menu and focuses the first link', () => {
      renderMenu()
      toggle().focus()

      fireEvent.keyDown(toggle(), { key: 'ArrowDown' })

      expect(toggle()).toHaveAttribute('aria-expanded', 'true')
      expect(menuLink('New Zealand')).toHaveFocus()
    })

    test('arrow keys move focus between the links, wrapping at the ends', () => {
      renderMenu()
      open()
      menuLink('New Zealand').focus()

      fireEvent.keyDown(menuLink('New Zealand'), { key: 'ArrowDown' })
      expect(menuLink('North Island')).toHaveFocus()

      fireEvent.keyDown(menuLink('North Island'), { key: 'ArrowDown' })
      fireEvent.keyDown(menuLink('South Island'), { key: 'ArrowDown' })
      expect(menuLink('New Zealand')).toHaveFocus()

      fireEvent.keyDown(menuLink('New Zealand'), { key: 'ArrowUp' })
      expect(menuLink('South Island')).toHaveFocus()
    })

    test('Home and End jump to the first and last link', () => {
      renderMenu()
      open()
      menuLink('North Island').focus()

      fireEvent.keyDown(menuLink('North Island'), { key: 'End' })
      expect(menuLink('South Island')).toHaveFocus()

      fireEvent.keyDown(menuLink('South Island'), { key: 'Home' })
      expect(menuLink('New Zealand')).toHaveFocus()
    })

    test('tabbing out of the menu closes it', () => {
      render(
        <Provider store={createStore()}>
          <DropDown heading="New Zealand" links={links} />
          <button>elsewhere</button>
        </Provider>,
      )
      open()
      menuLink('South Island').focus()

      fireEvent.blur(menuLink('South Island'), {
        relatedTarget: screen.getByRole('button', { name: 'elsewhere' }),
      })

      expect(toggle()).toHaveAttribute('aria-expanded', 'false')
    })

    test('moving focus within the menu keeps it open', () => {
      renderMenu()
      open()

      fireEvent.blur(menuLink('New Zealand'), {
        relatedTarget: menuLink('North Island'),
      })

      expect(toggle()).toHaveAttribute('aria-expanded', 'true')
    })

    // Safari does not focus a button on click, so a blur with no related target
    // happens when the toggle itself is pressed; closing then would reopen it.
    test('a blur with no new target does not close it', () => {
      renderMenu()
      open()

      fireEvent.blur(menuLink('New Zealand'), { relatedTarget: null })

      expect(toggle()).toHaveAttribute('aria-expanded', 'true')
    })
  })

  // It used to add a window keydown listener on every render, once per menu
  // (nine of them), and compare the deprecated keyCode.
  test('does not register global keyboard listeners', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const { rerender } = renderMenu()
    rerender(
      <Provider store={createStore()}>
        <DropDown heading="New Zealand" links={links} />
      </Provider>,
    )

    expect(
      add.mock.calls.filter(([type]) => String(type) === 'keydown'),
    ).toHaveLength(0)
    add.mockRestore()
  })
})
