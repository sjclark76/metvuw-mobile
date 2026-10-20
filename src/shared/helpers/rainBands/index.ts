export interface RainBand {
  /** The band's label on metvuw's key: its lightest rain, in mm. The last is "20+". */
  label: string
  /** Rain this heavy or heavier, up to the next band, in mm over 6 hours. */
  fromMm: number
  hexCode: string
}

/**
 * The colours of metvuw's rain charts, from its own key
 * (https://metvuw.com/pageheaders/scale.gif): accumulated rain over 6 hours, in 20
 * steps of 1 mm from 1 to 20+. Where there is less than 1 mm, the chart is not
 * coloured.
 */
export const RAIN_BANDS: ReadonlyArray<RainBand> = [
  { label: '1', fromMm: 1, hexCode: '#FF00FF' },
  { label: '2', fromMm: 2, hexCode: '#BF00FF' },
  { label: '3', fromMm: 3, hexCode: '#7F00FF' },
  { label: '4', fromMm: 4, hexCode: '#3F00FF' },
  { label: '5', fromMm: 5, hexCode: '#0000FF' },
  { label: '6', fromMm: 6, hexCode: '#003FFF' },
  { label: '7', fromMm: 7, hexCode: '#007FFF' },
  { label: '8', fromMm: 8, hexCode: '#00BFFF' },
  { label: '9', fromMm: 9, hexCode: '#00FFFF' },
  { label: '10', fromMm: 10, hexCode: '#00FFBF' },
  { label: '11', fromMm: 11, hexCode: '#00FF7F' },
  { label: '12', fromMm: 12, hexCode: '#00FF3F' },
  { label: '13', fromMm: 13, hexCode: '#00FF00' },
  { label: '14', fromMm: 14, hexCode: '#3FFF00' },
  { label: '15', fromMm: 15, hexCode: '#7FFF00' },
  { label: '16', fromMm: 16, hexCode: '#BFFF00' },
  { label: '17', fromMm: 17, hexCode: '#FFFF00' },
  { label: '18', fromMm: 18, hexCode: '#FFBF00' },
  { label: '19', fromMm: 19, hexCode: '#FF7F00' },
  { label: '20+', fromMm: 20, hexCode: '#FF3F00' },
]
