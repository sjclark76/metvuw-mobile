import { fireEvent, render, screen, within } from '@testing-library/react'

import { RadarKeySection } from './RadarKey'

const open = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Show radar key' }))

describe('<RadarKeySection />', () => {
  test('starts closed, and opens and closes with its button', () => {
    render(<RadarKeySection />)
    const button = screen.getByRole('button', { name: 'Show radar key' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('region', { name: 'Radar key' })).toBeNull()

    fireEvent.click(button)

    expect(
      screen.getByRole('button', { name: 'Hide radar key' }),
    ).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByRole('region', { name: 'Radar key' }),
    ).toBeInTheDocument()
  })

  test('is not mistaken for the rainfall key', () => {
    render(<RadarKeySection />)

    expect(screen.queryByRole('button', { name: /rainfall/i })).toBeNull()
  })

  test('draws the twelve colours, heaviest at the top, in metvuw’s colours', () => {
    const { container } = render(<RadarKeySection />)
    open()

    const colours = Array.from(
      container.querySelectorAll<HTMLElement>('[data-radar-band]'),
    ).map((band) => band.style.backgroundColor)
    expect(colours).toHaveLength(12)
    expect(colours[0]).toBe('rgb(0, 0, 255)')
    expect(colours[11]).toBe('rgb(95, 107, 177)')
  })

  test('says each colour’s strength on hover or long-press', () => {
    const { container } = render(<RadarKeySection />)
    open()

    const bands = container.querySelectorAll('[data-radar-band]')
    expect(bands[0]).toHaveAttribute('title', '60 to 70 dBZ, heavy')
    expect(bands[6]).toHaveAttribute('title', '20 to 25 dBZ, medium')
  })

  test('numbers the strengths between the colours, from 70 down to -5', () => {
    const { container } = render(<RadarKeySection />)
    open()

    const numbers = Array.from(container.querySelectorAll('[data-dbz]')).map(
      (el) => el.textContent,
    )
    expect(numbers).toEqual([
      '70',
      '60',
      '50',
      '40',
      '35',
      '30',
      '25',
      '20',
      '15',
      '10',
      '5',
      '0',
      '-5',
    ])
  })

  test('labels the groups, heavy at the top, as tall as their colours', () => {
    const { container } = render(<RadarKeySection />)
    open()

    const labels = Array.from(
      container.querySelectorAll<HTMLElement>('[data-radar-group]'),
    ).map((el) => [el.textContent, el.style.height])
    expect(labels).toEqual([
      ['Heavy', '72px'],
      ['Medium', '120px'],
      ['Light', '96px'],
    ])
  })

  test('says the colours blend, so they are matched by eye', () => {
    render(<RadarKeySection />)
    open()

    const panel = screen.getByRole('region', { name: 'Radar key' })
    expect(
      within(panel).getByText(/Colours blend smoothly on the radar/),
    ).toBeInTheDocument()
  })

  test('counts opening the key, not closing it', () => {
    window.gtag = vi.fn()
    render(<RadarKeySection />)

    open()
    fireEvent.click(screen.getByRole('button', { name: 'Hide radar key' }))

    expect(window.gtag).toHaveBeenCalledTimes(1)
    expect(window.gtag).toHaveBeenCalledWith('event', 'key_opened', {
      key: 'radar',
    })
    delete window.gtag
  })
})
