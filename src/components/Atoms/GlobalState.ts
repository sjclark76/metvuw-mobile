import { atom } from 'jotai'
import { atomWithStorage, createJSONStorage } from 'jotai/utils'

import { tolerantStorage } from '@/shared/helpers/tolerantStorage'

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
const themeAtom = atomWithStorage<ThemeChoice>(
  'theme',
  'system',
  createJSONStorage(() => tolerantStorage),
  { getOnInit: true },
)

/**
 * The pages saved for offline use. Their charts are in the browser's cache; this
 * is only what to remember about them. What is read back is not trusted (it is
 * the visitor's to edit, and an older version may have written it): see
 * `sanitizeSavedPages`. Read on the first render, because the sync that keeps
 * the pages current starts as soon as the app does.
 */
const savedPagesAtom = atomWithStorage<unknown>(
  'savedPages',
  [],
  createJSONStorage(() => tolerantStorage),
  { getOnInit: true },
)

export { favoritePageAtom, isMenuOpenAtom, savedPagesAtom, themeAtom }
export type { ThemeChoice }
