import { StorageImage } from '@/shared/types/storageImage'

export interface ScrapedImage extends StorageImage {
  originalImageURL: URL
  originalFileName: string
}
