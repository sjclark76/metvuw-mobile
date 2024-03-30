import { FileObject } from '@supabase/storage-js'

import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'

export function constructRainChartData(
  fileObjects: FileObject[],
  path: string,
): SkinnyRainChartData[] {
  const regex =
    /rain-(?<region>\w+)-thumb-(?<year>\d{4})(?<month>\d{2})(?<day>\d{2})(?<hour>\d{2})-(?<offset>\d{3}).gif/

  return fileObjects.map((fileObject) => {
    const fileName = fileObject.name
    const publicUrl = serviceRoleDb.storage
      .from('images')
      .getPublicUrl(`${path}/${fileName}`).data.publicUrl
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
