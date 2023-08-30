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
