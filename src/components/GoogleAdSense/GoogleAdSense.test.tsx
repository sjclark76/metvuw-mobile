import { render } from '@testing-library/react'

import { GoogleAdSense } from './GoogleAdSense'

vi.mock('next/script', () => ({
  default: ({ src }: { src: string }) => (
    <script data-testid="adsense" src={src} />
  ),
}))

function setCookie(value: string) {
  document.cookie = `show-ads=${value}; path=/`
}

describe('<GoogleAdSense />', () => {
  afterEach(() => {
    document.cookie = 'show-ads=; path=/; max-age=0'
  })

  test('loads the AdSense script when ads are shown', () => {
    setCookie('1')

    const { getByTestId } = render(<GoogleAdSense />)

    expect(getByTestId('adsense')).toHaveAttribute(
      'src',
      expect.stringContaining('pagead2.googlesyndication.com'),
    )
  })

  test('does not load the script when ads are hidden', () => {
    setCookie('0')

    const { queryByTestId } = render(<GoogleAdSense />)

    expect(queryByTestId('adsense')).not.toBeInTheDocument()
  })

  test('does not load the script when there is no cookie', () => {
    const { queryByTestId } = render(<GoogleAdSense />)

    expect(queryByTestId('adsense')).not.toBeInTheDocument()
  })
})
