import { StorageImage } from '@/shared/types/storageImage'

export interface ScrapeResult {
  ok: boolean
  toAdd: StorageImage[]
  toRemove: StorageImage[]
}
