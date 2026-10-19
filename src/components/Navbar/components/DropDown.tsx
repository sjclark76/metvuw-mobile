'use client'
import { useSetAtom } from 'jotai'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FocusEvent,
  KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'

import { isMenuOpenAtom } from '@/components/Atoms/GlobalState'
import { MenuLink } from '@/components/Navbar/types'

interface DropDownProps {
  heading: string
  links: MenuLink[]
}

/**
 * A navigation disclosure: a button that shows or hides a list of links. The
 * links are ordinary links in the tab order, so Tab, Enter and Space behave as
 * they do everywhere else. Arrow keys, Home and End are a convenience on top, and
 * Escape closes the list and returns focus to the button.
 */
const DropDown = (props: DropDownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const pendingFocus = useRef<number | null>(null)
  const listId = useId()
  const pathname = usePathname()
  const setMobileMenuOpen = useSetAtom(isMenuOpenAtom)

  const links = () =>
    Array.from(wrapperRef.current?.querySelectorAll('a') ?? [])

  // A press anywhere outside the whole control (button and list) closes it. The
  // list alone was checked before, so pressing the button counted as "outside":
  // it closed the menu and then the click reopened it.
  useEffect(() => {
    if (!isOpen) return

    const closeOnOutsidePress = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', closeOnOutsidePress)
    return () => document.removeEventListener('mousedown', closeOnOutsidePress)
  }, [isOpen])

  // Links can only take focus once the list is shown.
  useEffect(() => {
    if (isOpen && pendingFocus.current !== null) {
      links()[pendingFocus.current]?.focus()
      pendingFocus.current = null
    }
  }, [isOpen])

  const focusLink = (index: number) => links()[index]?.focus()

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = links()
    const current = items.indexOf(document.activeElement as HTMLAnchorElement)
    const last = items.length - 1

    switch (event.key) {
      case 'Escape':
        if (!isOpen) return
        event.preventDefault()
        setIsOpen(false)
        buttonRef.current?.focus()
        break
      case 'ArrowDown':
        event.preventDefault()
        if (!isOpen) {
          pendingFocus.current = 0
          setIsOpen(true)
        } else {
          focusLink(current < 0 || current === last ? 0 : current + 1)
        }
        break
      case 'ArrowUp':
        if (!isOpen) return
        event.preventDefault()
        focusLink(current <= 0 ? last : current - 1)
        break
      case 'Home':
        if (!isOpen || current < 0) return
        event.preventDefault()
        focusLink(0)
        break
      case 'End':
        if (!isOpen || current < 0) return
        event.preventDefault()
        focusLink(last)
        break
    }
  }

  // Tabbing to something outside closes the list. A blur with no new target is
  // ignored: Safari does not focus a button on click, so pressing the toggle
  // produces one, and closing then would let the click reopen the list.
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null
    if (next && !wrapperRef.current?.contains(next)) setIsOpen(false)
  }

  const closeAll = () => {
    setIsOpen(false)
    // Links navigate client-side, so nothing reloads the page to close the
    // mobile navigation behind this one.
    setMobileMenuOpen(false)
  }

  const headerText =
    'inline-flex items-center justify-center h-10 gap-2 px-5 font-bold tracking-wide text-bar-ink transition duration-300 rounded focus-visible:outline-none whitespace-nowrap hover:bg-white/10 focus:bg-white/15'

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex"
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    >
      <button
        ref={buttonRef}
        type="button"
        className={headerText}
        onClick={() => setIsOpen((prevState) => !prevState)}
        aria-expanded={isOpen}
        aria-controls={listId}
      >
        <span>{props.heading}</span>
        <span className="relative only:-mx-5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
            focusable="false"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </span>
      </button>
      <ul
        id={listId}
        // The attribute (not just a class) hides it from the tab order and from
        // assistive technology while closed.
        hidden={!isOpen}
        className="bg-plate ring-ink/10 absolute top-full z-30 mt-3 flex w-72 list-none flex-col rounded py-2 shadow-lg ring-1"
      >
        {props.links.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              onClick={closeAll}
              aria-current={pathname === item.href ? 'page' : undefined}
              className="text-ink-soft hover:bg-paper hover:text-ink focus-visible:bg-paper focus-visible:text-ink focus-visible:outline-cold aria-[current=page]:bg-paper aria-[current=page]:text-ink block truncate p-2 px-5 leading-5 transition-colors duration-300 focus-visible:outline-2 focus-visible:-outline-offset-2 aria-[current=page]:font-bold"
            >
              {item.value}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default DropDown
