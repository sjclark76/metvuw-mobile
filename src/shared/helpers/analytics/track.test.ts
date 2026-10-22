import { track } from './track'

describe('track', () => {
  afterEach(() => {
    delete window.gtag
  })

  test('sends the event to Google Analytics, with its details', () => {
    window.gtag = vi.fn()

    track('pin_added', { method: 'search' })

    expect(window.gtag).toHaveBeenCalledWith('event', 'pin_added', {
      method: 'search',
    })
  })

  test('sends an event with no details', () => {
    window.gtag = vi.fn()

    track('refresh_pressed')

    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'refresh_pressed',
      undefined,
    )
  })

  test('does nothing where there is no analytics tag', () => {
    expect(() => track('pin_added', { method: 'search' })).not.toThrow()
  })

  test('is never the feature’s problem, even if the tag throws', () => {
    window.gtag = vi.fn(() => {
      throw new Error('blocked')
    })

    expect(() => track('pin_added')).not.toThrow()
  })
})
