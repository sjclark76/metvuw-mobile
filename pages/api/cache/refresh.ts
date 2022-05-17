import { NextApiRequest, NextApiResponse } from 'next'
import { config } from '../../../config'

import { regions } from '../../../shared/region'
import { CacheImageResult, CacheRefeshResult } from '../types/cacheImageResult'
import axios, { AxiosResponse } from 'axios'

/**
 * Asynchronously calls our worker functions to refresh all the images for the satellite page and all region pages
 */
export async function cacheImages(): Promise<CacheRefeshResult> {
  const satelliteCacheUrl = new URL('api/cache/satellite', config.baseUrl)
  const satellitePromise = axios.get<CacheImageResult>(satelliteCacheUrl.href)

  const regionsPromise: Promise<AxiosResponse<CacheImageResult>>[] =
    regions.map((region) => {
      const apiURl = new URL(`api/cache/${region.code}`, config.baseUrl)

      return axios.get<CacheImageResult>(apiURl.href)
    })

  return Promise.all([satellitePromise, ...regionsPromise])
    .then((cacheImageResults) => {
      const cacheImageResult = cacheImageResults.map(
        (cacheImageResultResponse) => cacheImageResultResponse.data
      )
      return {
        success: cacheImageResult.every((value1) => value1.success),
        results: cacheImageResult,
      }
    })
    .catch((reason) => {
      return {
        success: false,
        reason,
        results: [],
      }
    })
}

const refresh = async (req: NextApiRequest, res: NextApiResponse) => {
  const result = await cacheImages()
  res.status(200).json(result)
}

export default refresh
