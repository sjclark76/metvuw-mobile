import { fadeInProps } from './fadeIn'

describe('fadeInProps', () => {
  test('fades in the first items, staggered', () => {
    expect(fadeInProps(0, 'w-full')).toEqual({
      className: 'w-full motion-safe:animate-fade-in-up',
      style: { animationDelay: '0ms' },
    })
    expect(fadeInProps(2).style).toEqual({ animationDelay: '200ms' })
  })

  test('does not fade in, or defer, the items in the first screen', () => {
    for (const index of [0, 1, 2]) {
      expect(fadeInProps(index).className).not.toContain('offscreen')
    }
  })

  // Items below the first screen skip layout and paint until they near the
  // viewport; the card list is about 40 tall image cards.
  // The room an item holds while it is skipped is its width times the chart's
  // aspect ratio. Radar and upper air charts are much taller than rain ones, and a
  // placeholder that is too short makes the page jump as items above the screen
  // are drawn: only noticed going back up, as WebKit does not hold the position.
  test('holds room for the shape of chart it is given', () => {
    expect(fadeInProps(5, 'w-full', 0.956).style).toEqual({
      '--chart-aspect': '0.956',
    })
  })

  test('says nothing about shape for items drawn at once', () => {
    expect(fadeInProps(1, 'w-full', 0.956).style).toEqual({
      animationDelay: '100ms',
    })
  })

  test('lets the browser skip rendering items further down', () => {
    expect(fadeInProps(3, 'w-full')).toEqual({
      className: 'w-full defer-offscreen',
    })
    expect(fadeInProps(30).style).toBeUndefined()
  })
})
