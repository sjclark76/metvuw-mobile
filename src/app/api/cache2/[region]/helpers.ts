import axios from 'axios'
import cheerio from 'cheerio'

import { RainChartDataCache } from '@/app/api/cache2/[region]/types'
import { config } from '@/config'
import { decodeRainUrl } from '@/shared/helpers/urlHelper'
import { Region } from '@/shared/region'

async function primeCache(url: URL) {
  try {
    const { status } = await axios.get(url.href)

    return status === 200
  } catch (e) {
    return false
  }
}
export async function getImageUrls(
  region: Region,
): Promise<RainChartDataCache[]> {
  const url = new URL(
    `forecast/forecast.php?type=rain&region=${region.code}&noofdays=10`,
    config.metvuwBaseUrl,
  )
  const response = await axios.get(url.href)

  let rawHtml = response.data

  const $ = cheerio.load(rawHtml)

  const images: cheerio.Cheerio = $('img[src*=rain]')

  const results = images.toArray().map((element: any) => {
    const relativeUrl = element.attribs.src
    const decodedSrc = decodeRainUrl(relativeUrl)
    const url = new URL(
      `forecast/${relativeUrl.substring(2)}`,
      config.cloudFrontUrl,
    )
    return {
      ...decodedSrc,
      url: url.href,
      width: +element.attribs.width,
      height: +element.attribs.height,
    }
  })

  const primedResults = results.map((result) => {
    return primeCache(url).then((value) => ({ ...result, primed: value }))
  })
  return Promise.all(primedResults)
}
