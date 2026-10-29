import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { render, screen } from '@testing-library/react'

import { parseSounding } from '@/shared/helpers/sounding/parseSounding'
import { summariseSounding } from '@/shared/helpers/sounding/summariseSounding'

import { SoundingChart } from './SoundingChart'

const sounding = parseSounding(
  readFileSync(
    join(
      __dirname,
      '../../shared/helpers/sounding/fixtures/invercargill-2026102912.html',
    ),
    'utf8',
  ),
)
const summary = summariseSounding(sounding)
const LAUNCH = Date.UTC(2026, 9, 29, 12)
const SOURCE = 'https://weather.uwyo.edu/wsgi/sounding?id=93844'

const renderChart = (metvuwNewestUTC?: number) =>
  render(
    <SoundingChart
      sounding={sounding}
      summary={summary}
      launchUTC={LAUNCH}
      sourceUrl={SOURCE}
      metvuwNewestUTC={metvuwNewestUTC}
    />,
  )

describe('<SoundingChart />', () => {
  test('draws the temperature and dew point by height', () => {
    renderChart()

    const chart = screen.getByRole('img', { name: /Balloon sounding/ })
    expect(chart.querySelector('[data-line="temperature"]')).toBeInTheDocument()
    expect(chart.querySelector('[data-line="dew-point"]')).toBeInTheDocument()
  })

  test('marks the cloud layers and the freezing level', () => {
    const { container } = renderChart()

    expect(container.querySelectorAll('[data-cloud]')).toHaveLength(2)
    expect(container.querySelector('[data-freezing]')).toHaveTextContent(
      'FREEZING 970 m',
    )
  })

  test('labels the temperature axis up to 20°, and keeps the freezing label left of the line', () => {
    const { container } = renderChart()

    expect(screen.getByText('20°')).toBeInTheDocument()
    expect(screen.getByText('-80°')).toBeInTheDocument()
    const label = container.querySelector('[data-freezing] text')
    expect(label).toHaveAttribute('x', '38')
    expect(label).toHaveAttribute('text-anchor', 'start')
  })

  test('shows the wind at each kilometre up to 9 km', () => {
    const { container } = renderChart()

    expect(container.querySelectorAll('[data-wind]')).toHaveLength(9)
  })

  test('says where metvuw stops, and which balloon this is', () => {
    renderChart(Date.UTC(2026, 9, 12, 11))

    expect(screen.getByRole('figure')).toHaveTextContent(
      "metvuw's charts stop at 13 Oct; this chart is drawn from Friday 1:00am's balloon.",
    )
  })

  test('says which balloon when metvuw has no charts', () => {
    renderChart()

    expect(screen.getByRole('figure')).toHaveTextContent(
      "This chart is drawn from Friday 1:00am's balloon.",
    )
  })

  test('explains the arrows and credits the data', () => {
    renderChart()

    expect(screen.getByRole('figure')).toHaveTextContent(
      'Arrows show where the wind blows to',
    )
    expect(
      screen.getByRole('link', { name: 'University of Wyoming data' }),
    ).toHaveAttribute('href', SOURCE)
  })

  test('keeps the lines inside the plot, even for readings outside its range', () => {
    const { container } = renderChart()

    const clip = container.querySelector('clipPath rect')
    expect(clip).toHaveAttribute('x', '34')
    expect(clip).toHaveAttribute('width', '266')
    const id = container.querySelector('clipPath')?.getAttribute('id')
    for (const line of container.querySelectorAll('[data-line]')) {
      expect(line).toHaveAttribute('clip-path', `url(#${id})`)
    }
  })

  test('points each wind arrow where the wind blows to', () => {
    const { container } = renderChart()

    // At 1 km the wind is from the west (about 270°): the arrow turns to point east.
    const arrow = container.querySelector('[data-wind] g')
    const degrees = Number(
      arrow?.getAttribute('transform')?.match(/rotate\(([\d.]+)\)/)?.[1],
    )
    expect(degrees).toBeGreaterThan(400)
    expect(degrees).toBeLessThan(500)
  })
})
