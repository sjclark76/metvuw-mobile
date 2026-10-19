'use client'
import { useAtom } from 'jotai'
import {
  FocusEvent,
  KeyboardEvent,
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import { themeAtom, ThemeChoice } from '@/components/Atoms/GlobalState'

const choices: { value: ThemeChoice; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-6"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

const icons: Record<ThemeChoice, ReactNode> = {
  system: (
    <Icon>
      <rect x="3" y="4.5" width="18" height="12" rx="1.5" />
      <path d="M9 20h6M12 16.5V20" />
    </Icon>
  ),
  light: (
    <Icon>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </Icon>
  ),
  dark: (
    <Icon>
      <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
    </Icon>
  ),
}

const isChoice = (value: unknown): value is ThemeChoice =>
  value === 'system' || value === 'light' || value === 'dark'

// The page is rendered ahead of time without the visitor's choice, so until it
// has mounted the menu shows the default rather than something that would not
// match when React hydrates.
const noSubscription = () => () => {}
const mounted = () => true
const notYetMounted = () => false

/**
 * Chooses between a light theme, a dark theme and the device's own setting. The
 * choice is saved the way the favourite page is, and applied to the page as a
 * `data-theme` attribute (left off for "system", which the stylesheet follows).
 */
export function ThemeMenu() {
  const [saved, setSaved] = useAtom(themeAtom)
  const isMounted = useSyncExternalStore(noSubscription, mounted, notYetMounted)
  const choice: ThemeChoice = isMounted && isChoice(saved) ? saved : 'system'

  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!isMounted) return
    if (choice === 'system') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', choice)
    }
  }, [choice, isMounted])

  useEffect(() => {
    if (!isOpen) return
    const onPress = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', onPress)
    return () => document.removeEventListener('mousedown', onPress)
  }, [isOpen])

  const choose = (value: ThemeChoice) => {
    setSaved(value)
    setIsOpen(false)
    buttonRef.current?.focus()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen) {
      setIsOpen(false)
      buttonRef.current?.focus()
    }
  }

  // Tabbing out closes it. A blur with no new target is the button itself being
  // pressed in Safari, which does not focus buttons on click: closing then would
  // only make the click reopen it.
  const onBlur = (event: FocusEvent) => {
    const next = event.relatedTarget as Node | null
    if (next && !wrapperRef.current?.contains(next)) setIsOpen(false)
  }

  const current = choices.find((c) => c.value === choice)!

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex"
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={`Theme: ${current.label}`}
        aria-expanded={isOpen}
        aria-controls={listId}
        className="text-bar-ink focus-visible:outline-bar-ink rounded-xs p-2.5 hover:bg-white/10 focus-visible:outline-2"
      >
        {icons[choice]}
      </button>
      <ul
        id={listId}
        hidden={!isOpen}
        className="bg-plate ring-ink/10 absolute top-full right-0 z-40 mt-2 w-40 list-none rounded py-2 shadow-lg ring-1"
      >
        {choices.map(({ value, label }) => (
          <li key={value}>
            <button
              type="button"
              aria-pressed={choice === value}
              onClick={() => choose(value)}
              className="text-ink-soft hover:bg-paper hover:text-ink focus-visible:outline-cold aria-pressed:text-ink flex w-full items-center gap-3 px-4 py-2 text-left leading-5 focus-visible:outline-2 focus-visible:-outline-offset-2 aria-pressed:font-bold"
            >
              {icons[value]}
              {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
