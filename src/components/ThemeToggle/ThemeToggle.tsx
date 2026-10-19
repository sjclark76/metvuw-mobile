'use client'
import { useSyncExternalStore } from 'react'

const darkQuery = '(prefers-color-scheme: dark)'
const hasMatchMedia = () => typeof matchMedia === 'function'

function subscribe(onChange: () => void) {
  window.addEventListener('themechange', onChange)
  if (!hasMatchMedia()) {
    return () => window.removeEventListener('themechange', onChange)
  }
  const system = matchMedia(darkQuery)
  system.addEventListener('change', onChange)
  return () => {
    window.removeEventListener('themechange', onChange)
    system.removeEventListener('change', onChange)
  }
}

// A saved choice (set on <html> before paint) wins; otherwise the system does.
function isDarkNow() {
  const chosen = document.documentElement.getAttribute('data-theme')
  if (chosen) return chosen === 'dark'
  return hasMatchMedia() && matchMedia(darkQuery).matches
}

// The page is rendered ahead of time without knowing the visitor's theme.
const lightOnTheHost = () => false

function MoonIcon() {
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
      <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
    </svg>
  )
}

function SunIcon() {
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
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </svg>
  )
}

/**
 * Switches between the light and dark theme. It follows the system until the
 * visitor chooses; the choice is saved and applied again on the next visit.
 */
export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, isDarkNow, lightOnTheHost)

  const choose = () => {
    const next = isDark ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem('theme', next)
    } catch {
      // Blocked storage: the theme still changes for this visit.
    }
    window.dispatchEvent(new Event('themechange'))
  }

  return (
    <button
      type="button"
      onClick={choose}
      aria-label="Dark mode"
      aria-pressed={isDark}
      className="text-bar-ink focus-visible:outline-bar-ink rounded-xs p-2.5 hover:bg-white/10 focus-visible:outline-2"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
