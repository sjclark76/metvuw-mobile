export interface CacheRequestResult {
  success: boolean
  bucket: string
  fileName: string
  reason?: string
}

export interface CacheRefreshResult
  extends Omit<CacheRequestResult, 'fileName'> {
  refreshTime: string
  results: CacheRequestResult[]
}
