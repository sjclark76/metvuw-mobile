// The axis labels of every region's chart, as read by eye from the real charts,
// top to bottom (latitude) and left to right (longitude). These are the only
// hand-entered facts; everything else is measured from the images.
// Longitudes past 180 are written as negative west longitudes, as on the charts.
export const LATITUDES = {
  nz: [-30, -35, -40, -45, -50],
  nzni: [-32, -34, -36, -38, -40, -42],
  nzsi: [-40, -42, -44, -46, -48],
  victoria: [-34, -36, -38, -40, -42],
  nsw: [-28, -30, -32, -34, -36, -38],
  waussie: [-15, -20, -25, -30, -35],
  swaussie: [-24, -26, -28, -30, -32, -34, -36],
  queensland: [-10, -15, -20, -25, -30],
  saussie: [-26, -28, -30, -32, -34, -36, -38],
  seaussie: [-20, -25, -30, -35, -40, -45],
  newcaledonia: [-18, -19, -20, -21, -22, -23, -24],
  swp: [0, -10, -20, -30, -40, -50, -60],
  europe: [70, 60, 50, 40, 30],
  uk: [60, 55, 50],
  estonia: [62, 60, 58, 56, 54],
  turkey: [45, 40, 35, 30],
  world: [60, 30, 0, -30, -60],
  usa: [50, 40, 30, 20],
  japan: [45, 40, 35, 30],
  safrica: [0, -10, -20, -30, -40],
  ocean: [-20, -30, -40],
  pacific: [-5, -10, -15, -20, -25],
  fiji: [-10, -11, -12, -13, -14, -15, -16, -17, -18, -19, -20, -21, -22, -23],
  spacific: [0, -30, -60],
  pitcairn: [-19, -20, -21, -22, -23, -24, -25, -26, -27, -28, -29, -30, -31],
  natlantic: [50, 40, 30, 20, 10, 0],
  satlantic: [0, -10, -20, -30, -40, -50],
}

export const LONGITUDES = {
  nz: [150, 160, 170, 180, -170],
  nzni: [165, 170, 175, 180],
  nzsi: [160, 165, 170, 175, 180],
  victoria: [140, 145, 150, 155],
  nsw: [140, 145, 150, 155],
  waussie: [100, 110, 120, 130, 140],
  swaussie: [110, 115, 120, 125, 130],
  queensland: [130, 135, 140, 145, 150, 155],
  saussie: [125, 130, 135, 140, 145],
  seaussie: [120, 130, 140, 150, 160],
  newcaledonia: [162, 164, 166, 168, 170],
  swp: [120, 150, 180, -150],
  europe: [-30, -20, -10, 0, 10, 20, 30, 40, 50, 60],
  uk: [-20, -10, 0, 10],
  estonia: [10, 15, 20, 25, 30, 35],
  turkey: [20, 25, 30, 35, 40, 45],
  world: [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180],
  usa: [-130, -120, -110, -100, -90, -80, -70, -60],
  japan: [120, 130, 140, 150],
  safrica: [0, 10, 20, 30, 40, 50, 60],
  ocean: [160, 170, 180, -170],
  pacific: [160, 170, 180, -170, -160],
  fiji: [170, 172, 174, 176, 178, 180, -178, -176, -174, -172, -170],
  spacific: [180, -150, -120, -90],
  pitcairn: [-138, -136, -134, -132, -130, -128, -126, -124, -122],
  natlantic: [-90, -80, -70, -60, -50, -40, -30, -20, -10, 0],
  satlantic: [-70, -60, -50, -40, -30, -20, -10, 0, 10, 20],
}

// The World chart's longitude labels run together (they are 47px apart and about
// 45px wide), so they cannot be found one by one. Where its labels' centres are
// hand-entered here, as pixel x positions, to start the fit from.
export const LONGITUDE_SEEDS = {
  world: [95, 142, 190, 237, 284, 331, 378, 426, 473, 520, 568, 615],
}

export const REGION_CODES = Object.keys(LATITUDES)
