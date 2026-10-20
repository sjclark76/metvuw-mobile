import {
  chartAspectRatio,
  radarImageDimensions,
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
