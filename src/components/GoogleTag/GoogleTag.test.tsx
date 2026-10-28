import { render } from '@testing-library/react'

import { track } from '@/shared/helpers/analytics/track'

import { GoogleTag, GoogleTagSetup, setUpGoogleTag } from './GoogleTag'

vi.mock('next/script', () => ({
  default: ({ src }: { src?: string }) => (
    // eslint-disable-next-line @next/next/no-sync-scripts -- test double for next/script
    <script data-testid="gtag-src" src={src} />
  ),
}))

type Queued = ArrayLike<unknown>
const win = window as unknown as { dataLayer?: Queued[]; gtag?: unknown }

const setupScript = (container: HTMLElement) =>
  container.querySelector('script#google-analytics')!.textContent!

describe('the Google tag', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    delete win.dataLayer
    delete win.gtag
  })

  // It used to request gtag/js?id=undefined and configure the literal
  // 'undefined' (for example on previews with no analytics id).
  test.each([
    ['unset', undefined],
    ['empty', ''],
  ])('loads nothing when the analytics id is %s', (_name, value) => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS', value as string)

    const { container } = render(
      <>
        <GoogleTagSetup />
        <GoogleTag />
      </>,
    )

    expect(container.querySelectorAll('script')).toHaveLength(0)
  })

  test('loads the tag script for the configured id', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS', 'G-ABC123')

    const { getByTestId } = render(<GoogleTag />)

    expect(getByTestId('gtag-src')).toHaveAttribute(
      'src',
      'https://www.googletagmanager.com/gtag/js?id=G-ABC123',
    )
  })

  test('sets the tag up for the configured id, in a plain script', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS', 'G-ABC123')

    const { container } = render(<GoogleTagSetup />)

    expect(setupScript(container)).toMatch(/\(window, "G-ABC123"\)$/)
  })

  // An event sent as the page starts up, before Google's script has loaded, used
  // to be dropped: gtag was only defined once the page was running.
  test('queues an event sent before Google’s script has loaded, after the settings', () => {
    setUpGoogleTag(window, 'G-ABC123')

    track('app_opened_installed')

    expect(
      win.dataLayer!.map((entry) => Array.from(entry).slice(0, 2)),
    ).toEqual([
      ['js', expect.any(Date)],
      ['config', 'G-ABC123'],
      ['event', 'app_opened_installed'],
    ])
  })

  test('keeps what was queued already', () => {
    win.dataLayer = [['earlier']]

    setUpGoogleTag(window, 'G-ABC123')

    expect(win.dataLayer[0]).toEqual(['earlier'])
  })

  test.each([
    ['quotes', `G-1'); alert(1); ('`],
    ['double quotes', `G-1"); alert(1); ("`],
    ['a closing script tag', `G-1</script><script>alert(1)</script>`],
  ])('keeps an id with %s inside one string literal', (_name, hostile) => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS', hostile)

    const { container, getByTestId } = render(
      <>
        <GoogleTagSetup />
        <GoogleTag />
      </>,
    )

    const inline = setupScript(container)
    const argument = inline.match(/\(window, (".*")\)$/)![1]
    // It parses back to exactly the id, so nothing escaped the literal...
    expect(JSON.parse(argument)).toBe(hostile)
    // ...and it can never close the surrounding <script> element.
    expect(inline).not.toContain('</script>')
    expect(getByTestId('gtag-src').getAttribute('src')).toBe(
      `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(hostile)}`,
    )
  })
})
