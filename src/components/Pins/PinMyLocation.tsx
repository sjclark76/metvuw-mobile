'use client'
import { useState } from 'react'

import { useIsMounted } from '@/components/Hooks/useIsMounted'
import { actionClasses } from '@/components/StatusMessage'
import { placeForLocation } from '@/shared/helpers/pins/locationPin'
import { pinId } from '@/shared/helpers/pins/pins'
import { loadPlaceSearch, type Place } from '@/shared/helpers/places'

// GPS can take a while to settle outdoors; longer than this and it is not coming.
const LOCATE_TIMEOUT_MS = 15_000

const messages = {
  idle: '',
  locating: 'Finding where you are…',
  denied:
    'Location is turned off for this site. Allow it in your browser settings, or search for the place.',
  unavailable: 'Couldn’t find where you are. Try again outside, or search.',
  already: 'Already added',
} as const

type Status = keyof typeof messages | { pinned: string }

const LocationIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="size-5 shrink-0"
    aria-hidden="true"
    focusable="false"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
    <circle cx="12" cy="12" r="7" />
  </svg>
)

/**
 * Pins the place the visitor is standing, named after the nearest place in the
 * list. The location is asked for only when the button is pressed, used once to
 * make the pin, and kept on the device like any other pin; it is never sent
 * anywhere. Not shown where the browser cannot tell where it is.
 */
export function PinMyLocation({
  pinned,
  onPick,
}: {
  /** The ids of the places already pinned. */
  pinned: ReadonlySet<string>
  onPick: (place: Place) => void
}) {
  const isMounted = useIsMounted()
  const [status, setStatus] = useState<Status>('idle')
  if (!isMounted || !('geolocation' in navigator)) return null

  const locate = () => {
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        // Without the list (offline before it was ever loaded) the coordinates
        // name the spot instead.
        const nearest = await loadPlaceSearch()
          .then((places) => places.nearest(latitude, longitude))
          .catch(() => undefined)
        const place = placeForLocation(latitude, longitude, nearest)
        if (pinned.has(pinId(place))) {
          setStatus('already')
          return
        }
        onPick(place)
        setStatus({ pinned: place.name })
      },
      (error) =>
        setStatus(
          error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable',
        ),
      {
        enableHighAccuracy: true,
        timeout: LOCATE_TIMEOUT_MS,
        maximumAge: 60_000,
      },
    )
  }

  const message =
    typeof status === 'string' ? messages[status] : `Added ${status.pinned}`

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={locate}
        disabled={status === 'locating'}
        className={`${actionClasses.secondary} gap-2`}
      >
        <LocationIcon />
        Add my location
      </button>
      {/* Read out as it changes; not a "status" role, which is the search's. */}
      <p
        aria-live="polite"
        data-locate-status
        className="text-ink-soft mt-2 min-h-5 font-mono text-xs"
      >
        {message}
      </p>
    </div>
  )
}
