import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { ChartData } from '@/shared/types/chartData'
import { StorageImage } from '@/shared/types/storageImage'

export type SkinnyChartData = Pick<ChartData, 'imageDateUTC' | 'url'>

export function constructChartData(images: StorageImage[]): SkinnyChartData[] {
  return images.map((image) => {
    const fileName = image.storagePath
    const { data: publicUrl } = serviceRoleDb.storage
      .from('images')
      .getPublicUrl(image.fullStoragePath)

    const year = +fileName.slice(0, 4)
    const month = +fileName.slice(4, 6) - 1
    const day = +fileName.slice(6, 8)
    const hour = +fileName.slice(8, 10)
    const utcDate = Date.UTC(year, month, day, hour)

    return {
      imageDateUTC: utcDate,
      url: publicUrl.publicUrl,
    }
  })
}
