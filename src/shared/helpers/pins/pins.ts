import { regionsCovering } from '@/shared/helpers/chartGeometry'
import type { Place } from '@/shared/helpers/places'
import { regions } from '@/shared/types/region'

/** A label is for the chart, where room is short. */
export const MAX_LABEL_LENGTH = 20

/** A place someone has pinned, with the label they may have given it. */
export interface Pin {
  id: string
  /** The place's own name, as the place list has it. */
  name: string
  /** The region or country, to tell two places of one name apart. */
  context: string
  /** What sort of place: "Town", "Hut"... */
  kind: string
  latitude: number
  longitude: number
  /** Shown on the charts instead of the name, if set. */
  label?: string
}

type Position = Pick<Place, 'name' | 'latitude' | 'longitude'>

/** One pin per place: the same name at the same spot, to about 100m. */
export const pinId = ({ name, latitude, longitude }: Position): string =>
  `${name}|${latitude.toFixed(3)}|${longitude.toFixed(3)}`

/** A label tidied up: trimmed, and no longer than a chart has room for. */
export function tidyLabel(label: string): string | undefined {
  const tidy = label.trim().slice(0, MAX_LABEL_LENGTH).trim()
  return tidy === '' ? undefined : tidy
}

export function pinFromPlace(place: Place): Pin {
  return {
    id: pinId(place),
    name: place.name,
    context: place.context,
    kind: place.kind,
    latitude: place.latitude,
    longitude: place.longitude,
  }
}

const isText = (value: unknown): value is string => typeof value === 'string'

/**
 * The pins in whatever was stored, dropping anything that is not one and a second
 * entry for the same place. What is stored is the visitor's to edit, so nothing in
 * it is trusted: the id is worked out again, a label is tidied, and a position has
 * to be a real one.
 */
export function sanitizePins(stored: unknown): Pin[] {
  if (!Array.isArray(stored)) return []
  const seen = new Set<string>()
  const pins: Pin[] = []
  for (const item of stored as unknown[]) {
    if (typeof item !== 'object' || item === null) continue
    const { name, context, kind, latitude, longitude, label } = item as Record<
      string,
      unknown
    >
    if (
      !isText(name) ||
      name.trim() === '' ||
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180
    ) {
      continue
    }
    const pin: Pin = {
      id: pinId({ name, latitude, longitude }),
      name,
      context: isText(context) ? context : '',
      kind: isText(kind) ? kind : '',
      latitude,
      longitude,
    }
    const tidy = isText(label) ? tidyLabel(label) : undefined
    if (tidy) pin.label = tidy
    if (seen.has(pin.id)) continue
    seen.add(pin.id)
    pins.push(pin)
  }
  return pins
}

/** The pins with this place added, unless it is pinned already. */
export function addPin(pins: Pin[], place: Place): Pin[] {
  const pin = pinFromPlace(place)
  return pins.some((other) => other.id === pin.id) ? pins : [...pins, pin]
}

export const removePin = (pins: Pin[], id: string): Pin[] =>
  pins.filter((pin) => pin.id !== id)

/** The pins with one pin's label set (tidied), or cleared if it comes out empty. */
export function setPinLabel(pins: Pin[], id: string, label: string): Pin[] {
  const tidy = tidyLabel(label)
  return pins.map((pin) => {
    if (pin.id !== id) return pin
    const { label: _previous, ...rest } = pin
    void _previous
    return tidy ? { ...rest, label: tidy } : rest
  })
}

/** What the charts call a pin: its label if it has one, else its name. */
export const chartLabel = (pin: Pin): string => pin.label ?? pin.name

/** The region charts that show a pin, each with where to see it. */
export function chartsShowing(
  pin: Pin,
): { code: string; name: string; href: string }[] {
  const covering = new Set<string>(regionsCovering(pin.latitude, pin.longitude))
  return regions
    .filter((region) => covering.has(region.code))
    .map((region) => ({
      code: region.code,
      name: region.name,
      href: `/regions/${region.code}`,
    }))
}
