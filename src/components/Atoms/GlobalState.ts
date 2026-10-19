import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

const isMenuOpenAtom = atom(false)

const favoritePageAtom = atomWithStorage<string | null>('favoritePage', null)

/** The visitor's choice of theme. "System" follows the device's own setting. */
type ThemeChoice = 'system' | 'light' | 'dark'

/**
 * Saved the way the favourite page is (jotai's storage atom, as JSON). Read on
 * the first render rather than after mount: the page applies the theme from this
 * value, and starting from "system" would flash the wrong theme before a saved
 * choice arrived. The theme script applies the same value before first paint.
 */
const themeAtom = atomWithStorage<ThemeChoice>('theme', 'system', undefined, {
  getOnInit: true,
})

export { favoritePageAtom, isMenuOpenAtom, themeAtom }
export type { ThemeChoice }
