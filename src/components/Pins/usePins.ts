'use client'
import { useAtomValue, useStore } from 'jotai'
import { useCallback, useMemo } from 'react'

import { pinsAtom } from '@/components/Atoms/GlobalState'
import {
  addPin,
  type Pin,
  removePin,
  sanitizePins,
  setPinLabel,
} from '@/shared/helpers/pins/pins'
import type { Place } from '@/shared/helpers/places'

/** The pins, and how to add, label and remove them. */
export function usePins() {
  const store = useStore()
  const stored = useAtomValue(pinsAtom)
  const pins: Pin[] = useMemo(() => sanitizePins(stored), [stored])

  // Each change is made to what is stored now, not to what this render saw.
  const change = useCallback(
    (update: (current: Pin[]) => Pin[]) =>
      store.set(pinsAtom, update(sanitizePins(store.get(pinsAtom)))),
    [store],
  )

  return {
    pins,
    add: useCallback(
      (place: Place) => change((c) => addPin(c, place)),
      [change],
    ),
    remove: useCallback(
      (id: string) => change((c) => removePin(c, id)),
      [change],
    ),
    setLabel: useCallback(
      (id: string, label: string) => change((c) => setPinLabel(c, id, label)),
      [change],
    ),
  }
}
