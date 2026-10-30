import type { Pin } from '@/shared/helpers/pins/pins'

import type {
  AlertColour,
  AlertSeverity,
  Polygon,
  WeatherAlert,
} from './parseCapAlert'

/** An alert, with the visitor's pins inside its area. */
export interface PinAlert {
  alert: WeatherAlert
  pins: Pin[]
  /** Not yet started: the note says when it will, not when it ends. */
  upcoming: boolean
}

const COLOUR_RANK: Record<AlertColour, number> = {
  Red: 3,
  Orange: 2,
  Yellow: 1,
}
const SEVERITY_RANK: Record<AlertSeverity, number> = {
  Extreme: 4,
  Severe: 3,
  Moderate: 2,
  Minor: 1,
  Unknown: 0,
}

/** Whether a place is inside a polygon of [latitude, longitude] corners (ray casting). */
function inPolygon(latitude: number, longitude: number, polygon: Polygon) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lonI] = polygon[i]
    const [latJ, lonJ] = polygon[j]
    if (
      latI > latitude !== latJ > latitude &&
      longitude < ((lonJ - lonI) * (latitude - latI)) / (latJ - latI) + lonI
    ) {
      inside = !inside
    }
  }
  return inside
}

const worstFirst = (a: PinAlert, b: PinAlert) =>
  (b.alert.colour ? COLOUR_RANK[b.alert.colour] : 0) -
    (a.alert.colour ? COLOUR_RANK[a.alert.colour] : 0) ||
  SEVERITY_RANK[b.alert.severity] - SEVERITY_RANK[a.alert.severity] ||
  a.alert.onsetUTC - b.alert.onsetUTC

/**
 * The alerts that cover any of the pins, and which pins they cover: ones that
 * have not ended, worst first. Done in the browser, so the pins stay on the
 * device.
 */
export function alertsForPins(
  alerts: readonly WeatherAlert[],
  pins: readonly Pin[],
  now: number,
): PinAlert[] {
  return alerts
    .filter((alert) => alert.expiresUTC > now)
    .flatMap((alert) => {
      const inside = pins.filter((pin) =>
        alert.areas.some((area) =>
          area.polygons.some((polygon) =>
            inPolygon(pin.latitude, pin.longitude, polygon),
          ),
        ),
      )
      return inside.length > 0
        ? [{ alert, pins: inside, upcoming: alert.onsetUTC > now }]
        : []
    })
    .sort(worstFirst)
}
