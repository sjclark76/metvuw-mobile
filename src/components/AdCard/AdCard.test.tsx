import { render } from '@testing-library/react'

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
})
