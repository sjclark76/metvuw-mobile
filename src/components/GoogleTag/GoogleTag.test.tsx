import { render } from '@testing-library/react'

import { GoogleTag } from './GoogleTag'

vi.mock('next/script', () => ({
  default: ({
    src,
    id,
    children,
  }: {
    src?: string
    id?: string
    children?: string
  }) => (
    // eslint-disable-next-line @next/next/no-sync-scripts -- test double for next/script
    <script data-testid={id ?? 'gtag-src'} src={src}>
      {children}
    </script>
  ),
}))

describe('<GoogleTag />', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  // It used to request gtag/js?id=undefined and configure the literal
  // 'undefined' (for example on previews with no analytics id).
  test.each([
    ['unset', undefined],
    ['empty', ''],
  ])('loads nothing when the analytics id is %s', (_name, value) => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS', value as string)

    const { container } = render(<GoogleTag />)

    expect(container.querySelectorAll('script')).toHaveLength(0)
  })

  test('loads the tag script for the configured id', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS', 'G-ABC123')

    const { getByTestId } = render(<GoogleTag />)

    expect(getByTestId('gtag-src')).toHaveAttribute(
      'src',
      'https://www.googletagmanager.com/gtag/js?id=G-ABC123',
    )
    expect(getByTestId('google-analytics').textContent).toContain(
      `gtag('config', "G-ABC123")`,
    )
  })

  test.each([
    ['quotes', `G-1'); alert(1); ('`],
    ['double quotes', `G-1"); alert(1); ("`],
    ['a closing script tag', `G-1</script><script>alert(1)</script>`],
  ])('keeps an id with %s inside one string literal', (_name, hostile) => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS', hostile)

    const { getByTestId } = render(<GoogleTag />)

    const inline = getByTestId('google-analytics').textContent!
    const argument = inline.match(/gtag\('config', (".*")\);/)![1]
    // It parses back to exactly the id, so nothing escaped the literal...
    expect(JSON.parse(argument)).toBe(hostile)
    // ...and it can never close the surrounding <script> element.
    expect(inline).not.toContain('</script>')
    expect(getByTestId('gtag-src').getAttribute('src')).toBe(
      `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(hostile)}`,
    )
  })
})
