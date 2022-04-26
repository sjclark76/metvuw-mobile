import axios from 'axios'
import cheerio from 'cheerio'
import { decodeSatelliteUrl } from './url'
import { NextApiRequest, NextApiResponse } from 'next'
import { SatelliteChartData } from './satelliteChartData'
import { config } from '../../config'

export async function getSatelliteImageUrls(): Promise<SatelliteChartData[]> {
  try {
    const response = await axios.get(
      new URL('satellite', config.metvuwBaseUrl).href
    )

    let rawHtml = response.data

    const $ = cheerio.load(rawHtml)

    const images: cheerio.Cheerio = $('img[src*=small]')

    return images.toArray().map((element: any) => {
      const relativeUrl = element.attribs.src
      let satelliteChartData = decodeSatelliteUrl(relativeUrl)

      const url = new URL(
        `satellite/big/${relativeUrl.substring(8)}`,
        config.cloudFrontUrl
      )

      return {
        ...satelliteChartData,
        url: url.href,
        width: element.attribs.width,
        height: element.attribs.height,
      }
    })
  } catch (e) {
    console.error(e)
  }
}

const satellite = async (req: NextApiRequest, res: NextApiResponse) => {
  const satelliteImages: SatelliteChartData[] = await getSatelliteImageUrls()
  res.status(200).json(satelliteImages)
}

export default satellite
