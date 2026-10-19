import { render, waitFor } from '@testing-library/react'

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

    // Hidden until AdSense says it has an ad, so an empty box is never shown.
    test('stays hidden until AdSense fills it', () => {
      const { container } = render(<AdCard />)

      expect(container.firstElementChild).toHaveStyle({ display: 'none' })
    })

    test('shows itself, with its Sponsored label, once AdSense fills it', async () => {
      const { container } = render(<AdCard />)

      setStatus(container, 'filled')

      await waitFor(() =>
        expect(container.firstElementChild).not.toHaveStyle({
          display: 'none',
        }),
      )
      expect(container).toHaveTextContent('Sponsored')
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

    test('stops watching for the ad status when it unmounts', () => {
      const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect')
      const { unmount } = render(<AdCard />)

      unmount()

      expect(disconnect).toHaveBeenCalled()
      disconnect.mockRestore()
    })
  })
})
