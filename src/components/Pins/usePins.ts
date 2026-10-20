'use client'
import { useAtomValue, useStore } from 'jotai'
import { useCallback, useMemo } from 'react'

import { pinsAtom } from '@/components/Atoms/GlobalState'
import { useIsMounted } from '@/components/Hooks/useIsMounted'
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

/**
 * How many places are pinned. Zero until the page is running in the browser,
 * since what is pinned is only known there.
 */
export function usePinCount(): number {
  const isMounted = useIsMounted()
  const { pins } = usePins()
  return isMounted ? pins.length : 0
}
