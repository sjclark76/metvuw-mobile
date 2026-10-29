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
})
