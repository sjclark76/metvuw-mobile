import { atom } from 'jotai/index'

export const loadedImageStateAtom = atom<Map<string, boolean>>(new Map())
