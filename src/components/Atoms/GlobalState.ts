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

/**
 * The places the visitor has pinned. Saved like the saved pages, and as little
 * trusted when it is read back: see `sanitizePins`. Read on the first render, so
 * the markers are there as soon as a chart is.
 */
const pinsAtom = atomWithStorage<unknown>(
  'pins',
  [],
  createJSONStorage(() => tolerantStorage),
  { getOnInit: true },
)

/**
 * Which pin the rain strip shows: a pin's id, or 'all'. Remembered, so the strip is
 * as it was left. A pin that has since gone is not an error: the strip falls back
 * to the first pin.
 */
const rainStripPinAtom = atomWithStorage<string>(
  'rainStripPin',
  'first',
  createJSONStorage(() => tolerantStorage),
  { getOnInit: true },
)

/**
 * Whether the footer has the animated viewer button, and whether it has the time
 * slider (with the rain strip on it). Both are shown unless the visitor turns them
 * off in Settings. Read on the first render, and also applied to the page by a
 * script before it first paints (see `layoutScript`), so a hidden footer never
 * flashes.
 */
const showViewerAtom = atomWithStorage<boolean>(
  'showViewer',
  true,
  createJSONStorage(() => tolerantStorage),
  { getOnInit: true },
)
const showSliderAtom = atomWithStorage<boolean>(
  'showSlider',
  true,
  createJSONStorage(() => tolerantStorage),
  { getOnInit: true },
)
const showHeavyRainAtom = atomWithStorage<boolean>(
  'showHeavyRain',
  true,
  createJSONStorage(() => tolerantStorage),
  { getOnInit: true },
)

/**
 * How times are written: 24-hour (14:00) or 12-hour (2:00pm). Not read on the
 * first render: the server draws 24-hour, so a saved 12-hour choice arrives after
 * mount rather than causing a hydration mismatch.
 */
type ClockChoice = '24h' | '12h'
const clockAtom = atomWithStorage<ClockChoice>(
  'clock',
  '24h',
  createJSONStorage(() => tolerantStorage),
)

export {
  clockAtom,
  favoritePageAtom,
  isMenuOpenAtom,
  pinsAtom,
  rainStripPinAtom,
  savedPagesAtom,
  showHeavyRainAtom,
  showSliderAtom,
  showViewerAtom,
  themeAtom,
}
export type { ClockChoice, ThemeChoice }
