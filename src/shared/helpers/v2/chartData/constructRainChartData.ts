import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { StorageImage } from '@/shared/types/storageImage'

export function constructRainChartData(
  images: StorageImage[],
): SkinnyRainChartData[] {
  const regex =
    /rain-(?<region>\w+)-thumb-(?<year>\d{4})(?<month>\d{2})(?<day>\d{2})(?<hour>\d{2})-(?<offset>\d{3}).webp/

  return images.map((image) => {
    const fileName = image.storagePath
    const publicUrl = serviceRoleDb.storage
      .from('images')
      .getPublicUrl(image.fullStoragePath).data.publicUrl
    const match = fileName.match(regex)?.groups || {}

    const getGroup = (groupName: string) => +match[groupName] || 0
    const [year, month, day, hour, offset] = [
      'year',
      'month',
      'day',
      'hour',
      'offset',
    ].map(getGroup)

    return {
      imageDateUTC: Date.UTC(year, month - 1, day, hour),
      url: publicUrl,
      forecastDate: new Date(
        Date.UTC(year, month - 1, day, hour + offset),
      ).toISOString(),
    }
  })
}
