export interface CacheImageResult {
  success: boolean
  fileName: string
  reason?: string
}

export interface CacheRefeshResult extends Omit<CacheImageResult, 'fileName'> {
  results: CacheImageResult[]
}
