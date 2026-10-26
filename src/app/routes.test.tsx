import NoForecast from '@/components/NoForecast'
import RegionPage from '@/components/RegionPage/RegionPage'
import { UpperAirPage } from '@/components/UpperAirPage'
import { config } from '@/config'
import {
  getRadarChartDataForCode,
  getRainChartDataForRegion,
  getSatelliteChartData,
  getUpperAirChartDataForCode,
} from '@/shared/helpers/dataSource/getWeatherChartData'
import { balloonLocations } from '@/shared/types/balloonLocations'
import { radarRegions } from '@/shared/types/radarRegions'
import { regions } from '@/shared/types/region'

import HomePage, {
  generateMetadata as homeMetadata,
} from './home/[region]/page'
import RadarRoute, {
  generateMetadata as radarMetadata,
} from './radar/[code]/page'
import RegionRoute, {
  generateMetadata as regionMetadata,
} from './regions/[name]/page'
import { generateMetadata as satelliteMetadata } from './satellite/[[...rest]]/page'
import UpperAirRoute, {
  generateMetadata as upperAirMetadata,
} from './upperair/[[...balloon]]/page'

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))

vi.mock('@/shared/helpers/dataSource/getWeatherChartData', () => ({
  getRainChartDataForRegion: vi.fn(),
  getRadarChartDataForCode: vi.fn(),
  getSatelliteChartData: vi.fn(),
  getUpperAirChartDataForCode: vi.fn(),
}))

const day = (d: number) => Date.UTC(2026, 9, d)
const rain = (d: number) => ({
  imageDateUTC: day(d),
  url: `https://x/${d}.gif`,
  forecastDate: new Date(day(d)).toISOString(),
})

describe('region page', () => {
  const route = (name: string) =>
    RegionRoute({ params: Promise.resolve({ name }) })

  test('is a 404 for a region that does not exist', async () => {
    await expect(route('atlantis')).rejects.toThrow('NEXT_NOT_FOUND')
    expect(getRainChartDataForRegion).not.toHaveBeenCalled()
  })

  test('says there is no forecast when the data is empty', async () => {
    vi.mocked(getRainChartDataForRegion).mockResolvedValue([])

    expect((await route('nzsi')).type).toBe(NoForecast)
  })

  test('loads the data for the region that was asked for', async () => {
    vi.mocked(getRainChartDataForRegion).mockResolvedValue([rain(1)])

    const page = await route('nzsi')

    expect(getRainChartDataForRegion).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'nzsi', name: 'South Island' }),
    )
    expect(page.type).toBe(RegionPage)
    expect(page.props.region).toMatchObject({ code: 'nzsi' })
  })

  test('shows the charts oldest first, whatever order they arrive in', async () => {
    vi.mocked(getRainChartDataForRegion).mockResolvedValue([
      rain(3),
      rain(1),
      rain(2),
    ])

    const page = await route('nz')

    expect(page.props.rainChartData.map((c: { url: string }) => c.url)).toEqual(
      ['https://x/1.gif', 'https://x/2.gif', 'https://x/3.gif'],
    )
  })

  test('titles the page for the region, with a canonical address for it', async () => {
    const metadata = await regionMetadata({
      params: Promise.resolve({ name: 'nzsi' }),
    })

    expect(metadata.title).toBe(
      'South Island rain & wind forecast | metvuw mobile',
    )
    expect(metadata.description).toContain('South Island')
    expect(metadata.description).not.toContain('nzsi')
    expect(metadata.alternates?.canonical).toBe('regions/nzsi')
  })
})

describe('page titles', () => {
  test('are different for every region, radar and weather balloon, and say what each is', async () => {
    const titles = [
      ...(await Promise.all(
        regions.map(
          async (r) =>
            (
              await regionMetadata({
                params: Promise.resolve({ name: r.code }),
              })
            ).title,
        ),
      )),
      ...(await Promise.all(
        Object.keys(radarRegions).map(
          async (code) =>
            (await radarMetadata({ params: Promise.resolve({ code }) })).title,
        ),
      )),
      ...(await Promise.all(
        Object.keys(balloonLocations).map(
          async (code) =>
            (
              await upperAirMetadata({
                params: Promise.resolve({ balloon: [code] }),
              })
            ).title,
        ),
      )),
    ]

    expect(new Set(titles).size).toBe(titles.length)
    for (const title of titles) {
      expect(String(title).length).toBeLessThanOrEqual(60)
    }
  })
})

describe('home page', () => {
  test('shows the New Zealand charts oldest first', async () => {
    vi.mocked(getRainChartDataForRegion).mockResolvedValue([rain(2), rain(1)])

    const page = await HomePage({ params: Promise.resolve({ region: 'nz' }) })

    expect(getRainChartDataForRegion).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'nz' }),
    )
    expect(page.props.rainChartData.map((c: { url: string }) => c.url)).toEqual(
      ['https://x/1.gif', 'https://x/2.gif'],
    )
  })

  test('is only the New Zealand forecast: anything else at its address is not found', async () => {
    await expect(
      HomePage({ params: Promise.resolve({ region: 'nzsi' }) }),
    ).rejects.toThrow()
  })

  test('is canonical at the site root', async () => {
    const metadata = await homeMetadata()

    expect(metadata.title).toBe(
      'New Zealand rain & wind forecast | metvuw mobile',
    )
    expect(metadata.alternates?.canonical).toBe(config.baseUrl)
  })
})

describe('radar page', () => {
  test.each(['xx', 'NL', '', '../nl'])(
    'is a 404 for the radar code %j',
    async (code) => {
      await expect(
        RadarRoute({ params: Promise.resolve({ code }) }),
      ).rejects.toThrow('NEXT_NOT_FOUND')
      expect(getRadarChartDataForCode).not.toHaveBeenCalled()
    },
  )

  test('titles the page and gives each radar its own canonical address', async () => {
    const metadata = await radarMetadata({
      params: Promise.resolve({ code: 'ak' }),
    })

    expect(metadata.title).toBe('Auckland rain radar | metvuw mobile')
    expect(metadata.alternates?.canonical).toBe('radar/ak')
  })
})

describe('satellite page', () => {
  test('is canonical at its own absolute address', async () => {
    const metadata = await satelliteMetadata()

    expect(metadata.title).toBe('metvuw mobile | Satellite')
    expect(metadata.alternates?.canonical).toBe(`${config.baseUrl}/satellite`)
    expect(getSatelliteChartData).not.toHaveBeenCalled()
  })
})

describe('upper air page', () => {
  const route = (balloon?: string[]) =>
    UpperAirRoute({ params: Promise.resolve({ balloon }) })
  const chart = { imageDateUTC: day(1), url: 'https://x/u.png' }

  test('shows the default station when none is given', async () => {
    vi.mocked(getUpperAirChartDataForCode).mockResolvedValue([chart])

    const page = await route()

    expect(getUpperAirChartDataForCode).toHaveBeenCalledWith('93112')
    expect(page.type).toBe(UpperAirPage)
    expect(page.props.balloonCode).toBe('93112')
  })

  test('shows the station that was asked for', async () => {
    vi.mocked(getUpperAirChartDataForCode).mockResolvedValue([chart])

    await route(['93844'])

    expect(getUpperAirChartDataForCode).toHaveBeenCalledWith('93844')
  })

  test.each([['00000'], ['nope'], ['93112x']])(
    'is a 404 for the station %j',
    async (...balloon) => {
      await expect(route(balloon)).rejects.toThrow('NEXT_NOT_FOUND')
      expect(getUpperAirChartDataForCode).not.toHaveBeenCalled()
    },
  )

  test('says there is no forecast when the data is empty', async () => {
    vi.mocked(getUpperAirChartDataForCode).mockResolvedValue([])

    expect((await route(['93417'])).type).toBe(NoForecast)
  })

  test('gives each station its own canonical address', async () => {
    const metadata = await upperAirMetadata({
      params: Promise.resolve({ balloon: ['93417'] }),
    })

    expect(metadata.title).toBe('Paraparaumu upper air charts | metvuw mobile')
    expect(metadata.alternates?.canonical).toBe('upperair/93417')
  })
})
