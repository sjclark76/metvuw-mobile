import { atom } from 'jotai'

const isMenuOpenAtom = atom(false)

const playAnimationAtom = atom(false)

const displayAnimatedChartAtom = atom(false)

const animatedChartIndexAtom = atom(0)

export {
  animatedChartIndexAtom,
  displayAnimatedChartAtom,
  isMenuOpenAtom,
  playAnimationAtom,
}
