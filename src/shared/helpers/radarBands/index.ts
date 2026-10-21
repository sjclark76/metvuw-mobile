export type RadarGroup = 'light' | 'medium' | 'heavy'

export interface RadarBand {
  /** The echo strength this colour begins at, in dBZ. */
  fromDbz: number
  /** The strength it runs up to. */
  toDbz: number
  hexCode: string
  /** How metvuw calls the rain this colour stands for. */
  group: RadarGroup
}

/**
 * The colours of metvuw's radar images, lightest rain first, from its own keys
 * (https://metvuw.com/pageheaders/radarscale.gif, with the strengths in dBZ, and
 * rainrate.gif, which labels the same twelve colours light, medium and heavy).
 *
 * A guide for the eye, not a lookup: the radar draws its colours blended smoothly
 * between these, so the colours in an image are not exactly these.
 */
export const RADAR_BANDS: ReadonlyArray<RadarBand> = [
  { fromDbz: -5, toDbz: 0, hexCode: '#5F6BB1', group: 'light' },
  { fromDbz: 0, toDbz: 5, hexCode: '#006666', group: 'light' },
  { fromDbz: 5, toDbz: 10, hexCode: '#669900', group: 'light' },
  { fromDbz: 10, toDbz: 15, hexCode: '#00CC00', group: 'light' },
  { fromDbz: 15, toDbz: 20, hexCode: '#99FF66', group: 'medium' },
  { fromDbz: 20, toDbz: 25, hexCode: '#FFFF00', group: 'medium' },
  { fromDbz: 25, toDbz: 30, hexCode: '#FF9933', group: 'medium' },
  { fromDbz: 30, toDbz: 35, hexCode: '#FF6600', group: 'medium' },
  { fromDbz: 35, toDbz: 40, hexCode: '#FF0000', group: 'medium' },
  { fromDbz: 40, toDbz: 50, hexCode: '#FF00FF', group: 'heavy' },
  { fromDbz: 50, toDbz: 60, hexCode: '#6699FF', group: 'heavy' },
  { fromDbz: 60, toDbz: 70, hexCode: '#0000FF', group: 'heavy' },
]
