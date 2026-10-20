import {
  chartAspectRatio,
  radarImageDimensions,
  rainCrop,
  rainImageDimensions,
  satelliteImageDimensions,
  upperAirImageDimensions,
} from './imageDimensions'

describe('chartAspectRatio', () => {
  // How tall a chart is for each unit of its width, which is what sets the room a
  // chart takes in the list.
  test.each([
    ['Rain', rainImageDimensions],
    ['Radar', radarImageDimensions],
    ['Satellite', satelliteImageDimensions],
    ['Upper Air', upperAirImageDimensions],
  ] as const)('is height over width for %s', (chartType, size) => {
    expect(chartAspectRatio(chartType)).toBeCloseTo(size.height / size.width, 6)
  })

  test('differs between the kinds of chart, which is why one number will not do', () => {
    const ratios = (['Rain', 'Radar', 'Satellite', 'Upper Air'] as const).map(
      chartAspectRatio,
    )

    expect(new Set(ratios.map((ratio) => ratio.toFixed(3))).size).toBe(4)
  })

  test('rain is the 0.701 the stylesheet assumed', () => {
    expect(chartAspectRatio('Rain')).toBeCloseTo(0.701, 3)
  })
})

describe('rainCrop', () => {
  // Positions on a processed rain chart (see chartGeometry) are worked out from this
  // rectangle, so it must stay what the compressor really cuts.
  test('is the rectangle cut from the full chart', () => {
    expect(rainCrop).toEqual({ left: 73, top: 116, width: 565, height: 396 })
  })

  test('is as big as a processed rain chart', () => {
    expect({ width: rainCrop.width, height: rainCrop.height }).toEqual(
      rainImageDimensions,
    )
  })
})
