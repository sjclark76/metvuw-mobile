import axios from 'axios'
import { NextResponse } from 'next/server'

import { config } from '@/config'
import { regions } from '@/shared/region'
import {
  CacheRefreshResult,
  CacheRequestResult,
} from '@/shared/types/cacheRequestResult'

export async function GET(): Promise<NextResponse<CacheRefreshResult>> {
  const cacheUrls = [
    'api/cache/satellite',
    'api/cache/radar',
    'api/cache/upper-air',
    ...regions.map((region) => `api/cache/rain/${region.code}`),
  ].map((path) => new URL(path, config.baseUrl))

  try {
    const responses = await Promise.all(
      cacheUrls.map((url) => axios.get<CacheRequestResult>(url.href)),
    )
    const cacheImageResult = responses.map((response) => response.data)
    const result: CacheRefreshResult = {
      refreshTime: new Date().toISOString(),
      success: cacheImageResult.every((v) => v.success),
      results: cacheImageResult,
      bucket: config.s3.bucketName,
    }
    return NextResponse.json(result)
  } catch (reason) {
    const result: CacheRefreshResult = {
      refreshTime: new Date().toISOString(),
      success: false,
      bucket: config.s3.bucketName,
      reason,
      results: [],
    }
    return NextResponse.json(result)
  }
}
