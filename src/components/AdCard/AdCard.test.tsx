import { act, render, waitFor } from '@testing-library/react'

import { config } from '@/config'

import { AdCard } from './AdCard'

describe('<AdCard />', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  // An ad unit with no slot id can never fill, so the card should not take up
  // space (it used to render <ins data-ad-slot={undefined}>).
  test.each([
    ['unset', undefined],
    ['empty', ''],
  ])('renders nothing when the slot id is %s', (_name, value) => {
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_SLOT_ID', value as string)

    const { container } = render(<AdCard />)

    expect(container).toBeEmptyDOMElement()
  })

  test('renders the ad unit for the configured slot and publisher', () => {
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_SLOT_ID', '1234567890')

    const { container } = render(<AdCard />)
    const unit = container.querySelector('ins.adsbygoogle')

    expect(unit).toHaveAttribute('data-ad-slot', '1234567890')
    expect(unit).toHaveAttribute('data-ad-client', config.adsenseClientId)
  })

  // Test ads are not counted, so seeing the ads outside production (to check how
  // they look) cannot be taken for invalid traffic.
  test('asks for test ads outside production', () => {
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_SLOT_ID', '1234567890')
    vi.stubEnv('NODE_ENV', 'development')

    const { container } = render(<AdCard />)

    expect(container.querySelector('ins.adsbygoogle')).toHaveAttribute(
      'data-adtest',
      'on',
    )
  })

  test('asks for real ads in production', () => {
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_SLOT_ID', '1234567890')
    vi.stubEnv('NODE_ENV', 'production')

    const { container } = render(<AdCard />)

    expect(container.querySelector('ins.adsbygoogle')).not.toHaveAttribute(
      'data-adtest',
    )
  })

  describe('filling', () => {
    beforeEach(() => {
      vi.stubEnv('NEXT_PUBLIC_ADSENSE_SLOT_ID', '1234567890')
      window.adsbygoogle = []
    })

    afterEach(() => {
      Reflect.deleteProperty(window, 'adsbygoogle')
    })

    const setStatus = (container: HTMLElement, status: string) =>
      container
        .querySelector('ins.adsbygoogle')!
        .setAttribute('data-ad-status', status)

    test('asks AdSense for one ad, once, however often it re-renders', () => {
      const { rerender } = render(<AdCard />)

      rerender(<AdCard />)
      rerender(<AdCard />)

      expect(window.adsbygoogle).toHaveLength(1)
    })

    // Shown, with its room held, while AdSense fills it: a hidden slot has no
    // width, and AdSense will not fill a slot with no width.
    test('holds its room while AdSense fills it, so the ad has a width', () => {
      const { container } = render(<AdCard />)

      expect(container.firstElementChild).not.toHaveStyle({ display: 'none' })
      expect(container.querySelector('ins.adsbygoogle')).toBeInTheDocument()
    })

    test('stays, with its Sponsored label, once AdSense fills it', async () => {
      vi.useFakeTimers()
      const { container } = render(<AdCard />)

      setStatus(container, 'filled')
      await act(() => vi.advanceTimersByTimeAsync(60_000))

      expect(container).toHaveTextContent('Sponsored')
      vi.useRealTimers()
    })

    test('removes itself when AdSense has no ad', async () => {
      const { container } = render(<AdCard />)

      setStatus(container, 'unfilled')

      await waitFor(() => expect(container).toBeEmptyDOMElement())
    })

    test('removes itself when AdSense cannot be asked', () => {
      window.adsbygoogle = {
        push: () => {
          throw new Error('adsbygoogle.push() error')
        },
      } as unknown as Record<string, unknown>[]

      const { container } = render(<AdCard />)

      expect(container).toBeEmptyDOMElement()
    })

    // AdSense blocked (an ad blocker, or a network filter): nothing answers, and an
    // empty box would stay in the list.
    test('removes itself when AdSense does not answer', async () => {
      vi.useFakeTimers()
      const { container } = render(<AdCard />)

      await act(() => vi.advanceTimersByTimeAsync(10_000))

      expect(container).toBeEmptyDOMElement()
      vi.useRealTimers()
    })

    test('stops watching for the ad status when it unmounts', () => {
      const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect')
      const { unmount } = render(<AdCard />)

      unmount()

      expect(disconnect).toHaveBeenCalled()
      disconnect.mockRestore()
    })
  })
})
