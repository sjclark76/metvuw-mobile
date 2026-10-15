import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

const isMenuOpenAtom = atom(false)

const favoritePageAtom = atomWithStorage<string | null>('favoritePage', null)

export { favoritePageAtom, isMenuOpenAtom }
