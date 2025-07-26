import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

const isMenuOpenAtom = atom(false)

const playAnimationAtom = atom(false)

const displayAnimatedChartAtom = atom(false)

const animatedChartIndexAtom = atom(0)

const favoritePageAtom = atomWithStorage<string | null>('favoritePage', null)

export {
  animatedChartIndexAtom,
  displayAnimatedChartAtom,
  favoritePageAtom,
  isMenuOpenAtom,
  playAnimationAtom,
}
