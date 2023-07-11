export interface CacheImageResult {
  success: boolean
  bucket: string
  fileName: string
  reason?: string
}

export interface CacheRefreshResult extends Omit<CacheImageResult, 'fileName'> {
  refreshTime: string
  results: CacheImageResult[]
}
