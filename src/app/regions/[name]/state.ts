import { atom } from 'jotai'

export const loadedImageStateAtom = atom<Map<string, boolean>>(new Map())
