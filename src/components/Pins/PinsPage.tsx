'use client'
import { useEffect, useMemo } from 'react'

import { useIsMounted } from '@/components/Hooks/useIsMounted'
import { track } from '@/shared/helpers/analytics/track'
import { loadPlaceSearch, type Place } from '@/shared/helpers/places'

import { PinList } from './PinList'
import { PinMyLocation } from './PinMyLocation'
import { PlaceSearch } from './PlaceSearch'
import { usePins } from './usePins'

/**
 * The Pins page: search for a place to pin, and the places pinned. What is pinned
 * is only known in the browser, so the list is not drawn before the page is
 * running there. Opening the page also loads the list of places once, so that
 * searching works afterwards even with no connection.
 */
export function PinsPage() {
  const isMounted = useIsMounted()
  const { pins, add, remove, setLabel } = usePins()
  const pinFrom = (method: 'search' | 'location') => (place: Place) => {
    track('pin_added', { method })
    add(place)
  }
  const pinned = useMemo(() => new Set(pins.map((pin) => pin.id)), [pins])

  useEffect(() => {
    // Not needed to show the page, so a failure here is no one's business.
    loadPlaceSearch().catch(() => {})
  }, [])

  return (
    <>
      <PlaceSearch pinned={pinned} onPick={pinFrom('search')} />
      <PinMyLocation pinned={pinned} onPick={pinFrom('location')} />
      <h2 className="font-display text-ink mt-10 mb-3 text-2xl font-bold tracking-[0.04em] uppercase">
        Your pins
      </h2>
      {isMounted && (
        <PinList
          pins={pins}
          onLabel={(id, label) => {
            if (label.trim()) track('pin_labelled')
            setLabel(id, label)
          }}
          onRemove={(id) => {
            track('pin_removed')
            remove(id)
          }}
        />
      )}
    </>
  )
}
