import axios, { AxiosResponse } from 'axios'
import { NextApiRequest, NextApiResponse } from 'next'

import { config } from '@/config'
import { regions } from '@/shared/region'
import {
  CacheRefreshResult,
  CacheRequestResult,
} from '@/shared/types/cacheRequestResult'

/**
 * Asynchronously calls our worker functions to refresh all the images for the satellite page and all region pages
 */
export async function cacheImages(): Promise<CacheRefreshResult> {
  const satelliteCacheUrl = new URL('api/cache/satellite', config.baseUrl)
  const satellitePromise = axios.get<CacheRequestResult>(satelliteCacheUrl.href)

  const regionsPromise: Promise<AxiosResponse<CacheRequestResult>>[] =
    regions.map((region) => {
      const apiURl = new URL(`api/cache/${region.code}`, config.baseUrl)

      return axios.get<CacheRequestResult>(apiURl.href)
    })

  const radarCacheUrl = new URL('api/cache/radar', config.baseUrl)
  const radarPromise = axios.get<CacheRequestResult>(radarCacheUrl.href)

  const upperAirCacheUrl = new URL('api/cache/upperair', config.baseUrl)
  const upperAirPromise = axios.get<CacheRequestResult>(upperAirCacheUrl.href)

  return Promise.all([
    upperAirPromise,
    radarPromise,
    satellitePromise,
    ...regionsPromise,
  ])
    .then((cacheImageResults) => {
      const cacheImageResult = cacheImageResults.map(
        (cacheImageResultResponse) => cacheImageResultResponse.data,
      )
      return {
        refreshTime: new Date().toISOString(),
        success: cacheImageResult.every((v) => v.success),
        results: cacheImageResult,
        bucket: config.s3.bucketName,
      }
    })
    .catch((reason) => {
      return {
        refreshTime: new Date().toISOString(),
        success: false,
        bucket: config.s3.bucketName,
        reason,
        results: [],
      }
    })
}

const refreshCacheApi = async (req: NextApiRequest, res: NextApiResponse) => {
  const result = await cacheImages()
  res.status(200).json(result)
}

export default refreshCacheApi
