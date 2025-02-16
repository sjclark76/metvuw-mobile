export type BalloonLocationCode = '93112' | '93417' | '93844'

export type BalloonLocation =
  | 'Whenuapai'
  | 'Paraparaumu'
  | 'Invercargill'
  | 'Raoul Island'

export const balloonLocations: Record<BalloonLocationCode, BalloonLocation> = {
  '93112': 'Whenuapai',
  '93417': 'Paraparaumu',
  '93844': 'Invercargill',
}

export function isBalloonLocationCode(
  value: string,
): value is BalloonLocationCode {
  return ['93112', '93417', '93844'].includes(value as BalloonLocationCode)
}

export function getsBalloonLocationCodeOrDefault(
  balloonLocationCode?: string,
): BalloonLocationCode | false {
  return !balloonLocationCode
    ? '93112'
    : isBalloonLocationCode(balloonLocationCode)
      ? balloonLocationCode
      : false
}
