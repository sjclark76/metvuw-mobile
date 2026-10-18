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
  test('lets the browser skip rendering items further down', () => {
    expect(fadeInProps(3, 'w-full')).toEqual({
      className: 'w-full defer-offscreen',
    })
    expect(fadeInProps(30).style).toBeUndefined()
  })
})
