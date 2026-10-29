import { render, screen } from '@testing-library/react'

import type { SoundingSummary } from '@/shared/helpers/sounding/summariseSounding'

import { SoundingGlance } from './SoundingGlance'

const full: SoundingSummary = {
  freezing: { kind: 'height', m: 970 },
  cloud: [
    { fromM: 581, toM: 918 },
    { fromM: 1071, toM: 1433 },
  ],
  inversion: false,
  winds: [
    { atKm: 1, compass: 'W', kt: 33 },
    { atKm: 3, compass: 'W', kt: 47 },
    { atKm: 5, compass: 'SW', kt: 56 },
  ],
  tempAt3kmC: -14,
  stability: 'stable',
}
// Friday 30 October 2026, 1:00am in New Zealand.
const LAUNCH = Date.UTC(2026, 9, 29, 12)
const SOURCE = 'https://weather.uwyo.edu/wsgi/sounding?id=93844'

const renderGlance = (summary: SoundingSummary) =>
  render(
    <SoundingGlance summary={summary} launchUTC={LAUNCH} sourceUrl={SOURCE} />,
  )
const panel = () => screen.getByRole('region', { name: 'At a glance' })

describe('<SoundingGlance />', () => {
  test('says what the balloon found, in plain words', () => {
    renderGlance(full)

    expect(panel()).toHaveTextContent('Freezing level 970 m')
    expect(panel()).toHaveTextContent('Cloud 600 – 900 m, 1,100 – 1,400 m')
    expect(panel()).toHaveTextContent(
      'Wind W 33 kt at 1 km · W 47 kt at 3 km · SW 56 kt at 5 km',
    )
    expect(panel()).toHaveTextContent('−14 °C at 3,000 m')
    expect(panel()).toHaveTextContent('Stable: thunderstorms unlikely')
  })

  test('says which balloon, and credits the data with a link', () => {
    renderGlance(full)

    expect(panel()).toHaveTextContent(
      "From Friday 1:00am's balloon · University of Wyoming data. What the balloon measured, not a forecast.",
    )
    expect(
      screen.getByRole('link', { name: 'University of Wyoming data' }),
    ).toHaveAttribute('href', SOURCE)
  })

  test('says the air is dry when there is no cloud', () => {
    renderGlance({ ...full, cloud: [] })

    expect(panel()).toHaveTextContent('Dry: no cloud layers')
  })

  test('mentions an inversion only when there is one', () => {
    renderGlance({ ...full, inversion: true })

    expect(panel()).toHaveTextContent(
      'Inversion near the ground: fog, haze or smog can be trapped',
    )
  })

  test('says freezing at ground level', () => {
    renderGlance({ ...full, freezing: { kind: 'ground' } })

    expect(panel()).toHaveTextContent('Freezing at ground level')
    expect(panel()).not.toHaveTextContent(/snow/i)
  })

  test('states a gap, and leaves out what it cannot say', () => {
    renderGlance({
      gapBelowM: 1500,
      cloud: [],
      inversion: false,
      winds: [],
    })

    expect(panel()).toHaveTextContent(
      'No readings below 1,500 m from this balloon',
    )
    expect(panel()).toHaveTextContent('Dry above 1,500 m: no cloud layers')
    expect(panel()).not.toHaveTextContent('Freezing')
    expect(panel()).not.toHaveTextContent('Wind')
    expect(panel()).not.toHaveTextContent('°C at 3,000 m')
    expect(panel()).not.toHaveTextContent('thunderstorms')
  })

  test('says thunderstorms are possible in unstable air', () => {
    renderGlance({ ...full, stability: 'unstable' })

    expect(panel()).toHaveTextContent('Unstable: thunderstorms possible')
  })
})
