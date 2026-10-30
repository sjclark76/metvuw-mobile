import { render, screen, within } from '@testing-library/react'

import type { Pin } from '@/shared/helpers/pins/pins'
import { formatInTimeZone, getBrowserTimeZone } from '@/shared/helpers/timeZone'
import type { PinAlert } from '@/shared/helpers/warnings/alertsForPins'
import type { WeatherAlert } from '@/shared/helpers/warnings/parseCapAlert'

import { AlertLines } from './AlertLines'

const pin = (name: string): Pin => ({
  id: name,
  name,
  context: 'New Zealand',
  kind: 'Town',
  latitude: 0,
  longitude: 0,
})
const alert = (extra: Partial<WeatherAlert> = {}): WeatherAlert => ({
  id: 'a',
  headline: 'Strong Wind Watch',
  event: 'wind',
  severity: 'Minor',
  colour: 'Yellow',
  colourHex: '#FFEB18',
  // 12:00 and 21:00 on Fri 30 Oct 2026, New Zealand time.
  onsetUTC: Date.UTC(2026, 9, 29, 23),
  expiresUTC: Date.UTC(2026, 9, 30, 8),
  web: 'https://metservice.com/warnings/home',
  areas: [],
  ...extra,
})
const covering = (
  pins: string[],
  extra: Partial<WeatherAlert> = {},
  upcoming = false,
): PinAlert => ({ alert: alert(extra), pins: pins.map(pin), upcoming })
const region = () => screen.getByRole('region', { name: 'Weather alerts' })
// The alert lines only: the credit below them has links too.
const lines = () => within(within(region()).getByRole('list'))

describe('<AlertLines />', () => {
  test('shows nothing without alerts', () => {
    const { container } = render(<AlertLines alerts={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  test('says what, where and until when, linked to MetService, in a new tab', () => {
    render(<AlertLines alerts={[covering(['Wanaka'])]} />)

    const link = within(region()).getByRole('link', {
      name: /Strong Wind Watch at Wanaka: until/,
    })
    expect(link).toHaveAttribute('href', 'https://metservice.com/warnings/home')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link.querySelector('strong')).toHaveTextContent(
      'Strong Wind Watch at Wanaka:',
    )
    expect(link.querySelector('span.underline')?.textContent).toMatch(
      /^until [A-Z][a-z]{2} \d{1,2}:\d{2}(am|pm)$/,
    )
  })

  test('names each link as opening in a new tab, for screen readers', () => {
    render(<AlertLines alerts={[covering(['Wanaka'])]} />)

    expect(
      lines().getByRole('link', { name: /\(opens in a new tab\)$/ }),
    ).toBeInTheDocument()
  })

  test('announces the alerts, which arrive after the page loads', () => {
    render(<AlertLines alerts={[covering(['Wanaka'])]} />)

    expect(within(region()).getByRole('list')).toHaveAttribute(
      'aria-live',
      'polite',
    )
  })

  test('says when an alert that has not started will', () => {
    render(<AlertLines alerts={[covering(['Wanaka'], {}, true)]} />)

    const link = lines().getByRole('link')
    expect(link.querySelector('strong')).toHaveTextContent(
      'Strong Wind Watch at Wanaka:',
    )
    expect(link.querySelector('span.underline')?.textContent).toMatch(
      /^from [A-Z][a-z]{2} \d{1,2}:\d{2}(am|pm)$/,
    )
  })

  test('shows the onset after from, and the expiry after until', () => {
    const at = (instant: number) =>
      formatInTimeZone(instant, 'EEE h:mmaaa', getBrowserTimeZone())
    render(
      <AlertLines
        alerts={[
          covering(['A'], { id: 'up' }, true),
          covering(['B'], { id: 'now' }, false),
        ]}
      />,
    )

    const [from, until] = lines()
      .getAllByRole('link')
      .map((link) => link.querySelector('span.underline')?.textContent)
    expect(from).toBe(`from ${at(alert().onsetUTC)}`)
    expect(until).toBe(`until ${at(alert().expiresUTC)}`)
    expect(from?.replace('from ', '')).not.toBe(until?.replace('until ', ''))
  })

  test.each([
    [['A'], 'A'],
    [['A', 'B'], 'A and B'],
    [['A', 'B', 'C'], 'A, B and C'],
  ])('names the places %j as %s', (names, expected) => {
    render(<AlertLines alerts={[covering(names)]} />)

    expect(lines().getByRole('link').textContent).toContain(
      `Strong Wind Watch at ${expected}:`,
    )
  })

  test('names a pin as the charts do: by its label when it has one', () => {
    const labelled = { ...pin('Wanaka'), label: 'The bach' }
    render(
      <AlertLines
        alerts={[{ alert: alert(), pins: [labelled], upcoming: false }]}
      />,
    )

    expect(lines().getByRole('link').textContent).toContain('at The bach:')
  })

  test("edges each line in MetService's colour, or the neutral edge without one", () => {
    render(
      <AlertLines
        alerts={[
          covering(['A']),
          covering(['B'], { colour: undefined, colourHex: undefined }),
        ]}
      />,
    )

    const [coloured, plain] = within(region()).getAllByRole('listitem')
    expect(coloured).toHaveStyle({ borderColor: '#FFEB18' })
    expect(plain.getAttribute('style') ?? '').not.toContain('border-color')
    expect(plain).toHaveClass('border-rule')
  })

  test('shows three lines, then says how many more', () => {
    render(
      <AlertLines
        alerts={['A', 'B', 'C', 'D', 'E'].map((name) =>
          covering([name], { id: name, headline: `Alert ${name}` }),
        )}
      />,
    )

    expect(lines().getAllByRole('link')).toHaveLength(3)
    expect(region()).toHaveTextContent('and 2 more')
  })

  test('credits MetService and the licence, and says the areas are simplified', () => {
    render(<AlertLines alerts={[covering(['Wanaka'])]} />)

    expect(region()).toHaveTextContent(
      'Alerts from MetService, licensed CC BY 4.0; areas simplified.',
    )
    expect(
      within(region()).getByRole('link', { name: 'MetService' }),
    ).toHaveAttribute('href', 'https://www.metservice.com')
    expect(
      within(region()).getByRole('link', { name: 'CC BY 4.0' }),
    ).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/4.0/')
  })

  test('shows focus on the credit links as on the alert lines', () => {
    render(<AlertLines alerts={[covering(['Wanaka'])]} />)

    for (const name of ['MetService', 'CC BY 4.0']) {
      expect(within(region()).getByRole('link', { name })).toHaveClass(
        'focus-visible:outline-cold',
        'rounded-sm',
        'focus-visible:outline-2',
        'focus-visible:outline-offset-2',
      )
    }
  })
})
