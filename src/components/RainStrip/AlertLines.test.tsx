import { fireEvent, render, screen, within } from '@testing-library/react'

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
// Charts every six hours on Fri 30 Oct 2026 (UTC). The alert's map is for 11:00
// UTC by default: the 12:00 chart (index 2) is the nearest.
const times = [0, 6, 12, 18].map((hour) => Date.UTC(2026, 9, 30, hour))
const covering = (
  pins: string[],
  extra: Partial<WeatherAlert> = {},
  upcoming = false,
  mapTimeUTC = Date.UTC(2026, 9, 30, 11),
): PinAlert => ({
  alert: alert(extra),
  pins: pins.map(pin),
  upcoming,
  mapTimeUTC,
})
const lines = (
  alerts: PinAlert[],
  onSeek: (index: number) => void = () => {},
  chartTimes: readonly number[] = times,
) => render(<AlertLines alerts={alerts} times={chartTimes} onSeek={onSeek} />)
const region = () => screen.getByRole('region', { name: 'Weather alerts' })
// The alert lines only: the credit below them has links too.
const list = () => within(within(region()).getByRole('list'))
const at = (instant: number) =>
  formatInTimeZone(instant, 'EEE h:mmaaa', getBrowserTimeZone())

describe('<AlertLines />', () => {
  test('shows nothing without alerts', () => {
    const { container } = lines([])

    expect(container).toBeEmptyDOMElement()
  })

  test('says what, where and until when', () => {
    lines([covering(['Wanaka'])])

    const [item] = list().getAllByRole('listitem')
    expect(item.querySelector('strong')).toHaveTextContent(
      'Strong Wind Watch at Wanaka:',
    )
    expect(item.querySelector('time')?.textContent).toBe(at(alert().expiresUTC))
    expect(item).toHaveTextContent(`until ${at(alert().expiresUTC)}`)
  })

  test('says from when for an alert that has not started', () => {
    lines([covering(['Wanaka'], {}, true)])

    expect(list().getAllByRole('listitem')[0]).toHaveTextContent(
      `from ${at(alert().onsetUTC)}`,
    )
  })

  test('names the time in a time element, for the start or the end', () => {
    lines([
      covering(['A'], { id: 'up' }, true),
      covering(['B'], { id: 'now' }, false),
    ])

    const [from, until] = list()
      .getAllByRole('listitem')
      .map((item) => item.querySelector('time'))
    expect(from).toHaveAttribute(
      'datetime',
      new Date(alert().onsetUTC).toISOString(),
    )
    expect(until).toHaveAttribute(
      'datetime',
      new Date(alert().expiresUTC).toISOString(),
    )
  })

  describe('the link to the original alert', () => {
    test('goes to MetService, in a new tab', () => {
      lines([covering(['Wanaka'])])

      const link = list().getByRole('link', {
        name: 'On MetService (opens in a new tab)',
      })
      expect(link).toHaveAttribute(
        'href',
        'https://metservice.com/warnings/home',
      )
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    test('is one for each alert, to its own page', () => {
      lines([
        covering(['A'], { id: 'a', web: 'https://metservice.com/a' }),
        covering(['B'], { id: 'b', web: 'https://www.metservice.com/b' }),
      ])

      expect(
        list()
          .getAllByRole('link', { name: /On MetService/ })
          .map((link) => link.getAttribute('href')),
      ).toEqual(['https://metservice.com/a', 'https://www.metservice.com/b'])
    })
  })

  describe('the button to the map', () => {
    test('says which chart it opens, the one nearest the time of the alert', () => {
      lines([covering(['Wanaka'])])

      expect(
        list().getByRole('button', { name: `Map for ${at(times[2])}` }),
      ).toBeInTheDocument()
    })

    test('opens that chart', () => {
      const onSeek = vi.fn()
      lines([covering(['Wanaka'])], onSeek)

      fireEvent.click(list().getByRole('button'))

      expect(onSeek).toHaveBeenCalledTimes(1)
      expect(onSeek).toHaveBeenCalledWith(2)
    })

    test('opens the chart nearest the time of each alert', () => {
      const onSeek = vi.fn()
      lines(
        [
          covering(['A'], { id: 'early' }, false, Date.UTC(2026, 9, 30, 1)),
          covering(['B'], { id: 'late' }, false, Date.UTC(2026, 9, 30, 20)),
        ],
        onSeek,
      )

      const [early, late] = list().getAllByRole('button')
      fireEvent.click(late)
      fireEvent.click(early)

      expect(onSeek.mock.calls).toEqual([[3], [0]])
    })

    test('is not there when the page has no charts to open', () => {
      lines([covering(['Wanaka'])], () => {}, [])

      expect(list().queryByRole('button')).not.toBeInTheDocument()
      expect(list().getByRole('link', { name: /On MetService/ })).toBeVisible()
    })
  })

  test('announces the alerts, which arrive after the page loads', () => {
    lines([covering(['Wanaka'])])

    expect(within(region()).getByRole('list')).toHaveAttribute(
      'aria-live',
      'polite',
    )
  })

  test.each([
    [['A'], 'A'],
    [['A', 'B'], 'A and B'],
    [['A', 'B', 'C'], 'A, B and C'],
  ])('names the places %j as %s', (names, expected) => {
    lines([covering(names)])

    expect(list().getAllByRole('listitem')[0]).toHaveTextContent(
      `Strong Wind Watch at ${expected}:`,
    )
  })

  test('names a pin as the charts do: by its label when it has one', () => {
    const labelled = { ...pin('Wanaka'), label: 'The bach' }
    lines([
      {
        alert: alert(),
        pins: [labelled],
        upcoming: false,
        mapTimeUTC: times[0],
      },
    ])

    expect(list().getAllByRole('listitem')[0]).toHaveTextContent('at The bach:')
  })

  test("edges each line in MetService's colour, or the neutral edge without one", () => {
    lines([
      covering(['A']),
      covering(['B'], { colour: undefined, colourHex: undefined }),
    ])

    const [coloured, plain] = within(region()).getAllByRole('listitem')
    expect(coloured).toHaveStyle({ borderColor: '#FFEB18' })
    expect(plain.getAttribute('style') ?? '').not.toContain('border-color')
    expect(plain).toHaveClass('border-rule')
  })

  test('shows three lines, then says how many more', () => {
    lines(
      ['A', 'B', 'C', 'D', 'E'].map((name) =>
        covering([name], { id: name, headline: `Alert ${name}` }),
      ),
    )

    expect(list().getAllByRole('link', { name: /On MetService/ })).toHaveLength(
      3,
    )
    expect(list().getAllByRole('button')).toHaveLength(3)
    expect(region()).toHaveTextContent('and 2 more')
  })

  test('credits MetService and the licence, and says the areas are simplified', () => {
    lines([covering(['Wanaka'])])

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

  test('shows focus on every link and button, as on the credit links', () => {
    lines([covering(['Wanaka'])])

    for (const element of [
      within(region()).getByRole('link', { name: 'MetService' }),
      within(region()).getByRole('link', { name: 'CC BY 4.0' }),
      list().getByRole('link', { name: /On MetService/ }),
      list().getByRole('button'),
    ]) {
      expect(element).toHaveClass(
        'focus-visible:outline-cold',
        'rounded-sm',
        'focus-visible:outline-2',
        'focus-visible:outline-offset-2',
      )
    }
  })
})
