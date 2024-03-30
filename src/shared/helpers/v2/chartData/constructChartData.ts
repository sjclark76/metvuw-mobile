import { FileObject } from '@supabase/storage-js'

import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { ChartData } from '@/shared/types/chartData'

export function constructChartData(
  fileObjects: FileObject[],
  path: string,
  dimensions: { height: number; width: number },
): ChartData[] {
  return fileObjects.map((fileObject) => {
    const fileName = fileObject.name
    const { data: publicUrl } = serviceRoleDb.storage
      .from('images')
      .getPublicUrl(`${path}/${fileName}`)

    const year = +fileName.slice(0, 4)
    const month = +fileName.slice(4, 6) - 1
    const day = +fileName.slice(6, 8)
    const hour = +fileName.slice(8, 10)
    const utcDate = Date.UTC(year, month, day, hour)

    return {
      day: day,
      hour: hour,
      imageDateISO: new Date(utcDate).toISOString(),
      imageDateUTC: utcDate,
      month: month,
      name: fileName,
      path: '',
      url: publicUrl.publicUrl,
      ...dimensions,
      year: year,
    }
  })
}
