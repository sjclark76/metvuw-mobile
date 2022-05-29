export interface CacheImageResult {
  success: boolean
  bucket: string
  fileName: string
  reason?: string
}

export interface CacheRefeshResult extends Omit<CacheImageResult, 'fileName'> {
  results: CacheImageResult[]
}
