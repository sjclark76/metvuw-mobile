import { atomWithStorage } from 'jotai/vanilla/utils'

export const favouritePageAtom = atomWithStorage<string | undefined>(
  'FavouritePage',
  undefined,
)
