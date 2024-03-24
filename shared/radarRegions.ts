export type RadarCode =
  | 'nl'
  | 'ak'
  | 'bp'
  | 'mh'
  | 'np'
  | 'wn'
  | 'ch'
  | 'wl'
  | 'nv'

export type RadarRegion =
  | 'Northland'
  | 'Auckland'
  | 'Bay of Plenty'
  | 'Hawkes Bay'
  | 'Taranaki'
  | 'Wellington'
  | 'Westland'
  | 'Christchurch'
  | 'Southland'

export const radarRegions: Record<RadarCode, RadarRegion> = {
  nl: 'Northland',
  ak: 'Auckland',
  bp: 'Bay of Plenty',
  mh: 'Hawkes Bay',
  np: 'Taranaki',
  wn: 'Wellington',
  ch: 'Christchurch',
  wl: 'Westland',
  nv: 'Southland',
}

export function isRadarCode(value: string): value is RadarCode {
  return ['nl', 'ak', 'bp', 'mh', 'np', 'wn', 'ch', 'wl', 'nv'].includes(
    value as RadarCode,
  )
}
