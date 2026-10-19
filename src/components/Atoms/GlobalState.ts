import { atom } from 'jotai'
import { atomWithStorage, createJSONStorage } from 'jotai/utils'

const isMenuOpenAtom = atom(false)

const favoritePageAtom = atomWithStorage<string | null>('favoritePage', null)

/**
 * localStorage, minus its exceptions. A browser that blocks it (private modes,
 * a full quota) throws on every call, and a choice that cannot be saved should
 * still take effect for the visit, not break the button that made it.
 */
const tolerantStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value)
    } catch {
      // Not saved; it still applies until the page is closed.
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key)
    } catch {
      // Nothing to remove.
    }
  },
}

/** The visitor's choice of theme. "System" follows the device's own setting. */
type ThemeChoice = 'system' | 'light' | 'dark'

/**
 * Saved the way the favourite page is (jotai's storage atom, as JSON). Read on
 * the first render rather than after mount: the page applies the theme from this
 * value, and starting from "system" would flash the wrong theme before a saved
 * choice arrived. The theme script applies the same value before first paint.
 */
const themeAtom = atomWithStorage<ThemeChoice>(
  'theme',
  'system',
  createJSONStorage(() => tolerantStorage),
  { getOnInit: true },
)

export { favoritePageAtom, isMenuOpenAtom, themeAtom }
export type { ThemeChoice }
