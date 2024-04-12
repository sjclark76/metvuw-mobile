import { StorageImage } from '@/shared/types/storageImage'

export interface ScrapedImage extends StorageImage {
  originalImageURL: string
  originalFileName: string
  smallImageStoragePath?: string
}
