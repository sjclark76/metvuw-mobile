import {
  FallbackImageVariant,
  withFallbackImageProxyVariant,
} from '@/shared/helpers/dataSource/fallbackImageProxyUrl'
import {
  getRadarChartDataForCode,
  getRainChartDataForRegion,
  getSatelliteChartData,
  getUpperAirChartDataForCode,
} from '@/shared/helpers/dataSource/getWeatherChartData'
import { fetchSounding } from '@/shared/helpers/sounding/fetchSounding'
import { showOwnChart } from '@/shared/helpers/sounding/showOwnChart'
import {
  balloonLocations,
  getsBalloonLocationCodeOrDefault,
} from '@/shared/types/balloonLocations'
import { isRadarCode, radarRegions } from '@/shared/types/radarRegions'
import { findRegionByCode } from '@/shared/types/region'

/** Everything needed to keep one chart page for offline use. */
export interface ChartList {
  /** What the visitor calls the page, for the list of saved pages. */
  title: string
  /** The page's own path, without a query string or trailing slash. */
  path: string
  /**
   * Other addresses that show the same page: the home page is the New Zealand
   * forecast. Saved as one page, so it counts as saved at either.
   */
  aliases: string[]
  /** When the charts were issued (epoch ms): the earliest chart's time. */
  issued: number | undefined
  /** Every image the page can ask for, in page order. */
  urls: string[]
}

interface Chart {
  url: string
  imageDateUTC: number
}

/**
 * Phones are served the small version of satellite and upper air charts, others
 * the full one, so a page kept for offline use needs both.
 */
function withSmallVariant(charts: Chart[], small: boolean): string[] {
  const variants: FallbackImageVariant[] = small
    ? ['primary', 'small']
    : ['primary']
  return charts.flatMap(({ url }) =>
    variants.map((variant) =>
      variant === 'primary'
        ? url
        : withFallbackImageProxyVariant(url, variant)!,
    ),
  )
}

function build(
  title: string,
  path: string,
  charts: Chart[],
  small: boolean,
  aliases: string[] = [],
): ChartList {
  return {
    title,
    path,
    aliases,
    issued: charts.length
      ? Math.min(...charts.map((chart) => chart.imageDateUTC))
      : undefined,
    urls: withSmallVariant(charts, small),
  }
}

const HOME_PATH = '/'
const NEW_ZEALAND_PATH = '/regions/nz'

/** The path alone: no origin, query string, fragment or trailing slash. */
function cleanPath(path: string): string | undefined {
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.startsWith('/\\')
  ) {
    return undefined
  }
  const bare = path.split(/[?#]/)[0]
  // A loop, not a regular expression: the path comes from the query string, and a
  // pattern for trailing slashes can take quadratic time on a long run of them.
  let end = bare.length
  while (end > 1 && bare[end - 1] === '/') end--
  return bare.slice(0, end)
}

/**
 * The charts on one of the app's chart pages, or undefined for a path that is
 * not one. The path is matched against the same codes the pages themselves
 * accept, so this cannot be made to fetch anything else.
 */
export async function chartListForPath(
  rawPath: string,
): Promise<ChartList | undefined> {
  const path = cleanPath(rawPath)
  if (!path) return undefined
  // The home page is the New Zealand forecast: one page, two addresses. It is
  // kept as the region page, which covers the home page too.
  if (path === '/') return chartListForPath(NEW_ZEALAND_PATH)
  const [, section, code, ...rest] = path.split('/')
  if (rest.length > 0) return undefined

  switch (section) {
    case 'regions': {
      const region = code ? findRegionByCode(code) : undefined
      if (!region) return undefined
      return build(
        region.name,
        path,
        await getRainChartDataForRegion(region),
        false,
        path === NEW_ZEALAND_PATH ? [HOME_PATH] : [],
      )
    }
    case 'satellite':
      if (code) return undefined
      return build(
        'Satellite, New Zealand',
        path,
        await getSatelliteChartData(),
        true,
      )
    case 'radar': {
      if (!code || !isRadarCode(code)) return undefined
      return build(
        `Radar, ${radarRegions[code]}`,
        path,
        await getRadarChartDataForCode(code),
        false,
      )
    }
    case 'upperair': {
      const station = getsBalloonLocationCodeOrDefault(code)
      if (station === false) return undefined
      const [charts, sounding] = await Promise.all([
        getUpperAirChartDataForCode(station),
        fetchSounding(station),
      ])
      const list = build(
        `Upper air, ${balloonLocations[station]}`,
        path,
        charts,
        true,
      )
      // Where our chart replaces metvuw's, the page is "issued" when the balloon
      // went up, so each new balloon refreshes a saved copy.
      if (
        sounding &&
        showOwnChart(
          charts.map((chart) => chart.imageDateUTC),
          sounding.launchUTC,
        )
      ) {
        list.issued = sounding.launchUTC
      }
      return list
    }
    default:
      return undefined
  }
}
