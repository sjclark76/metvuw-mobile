import axios from 'axios'

import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { ChartData } from '@/shared/types/chartData'

async function downloadImageToBuffer(url: string) {
  const response = await axios({
    method: 'GET',
    responseType: 'arraybuffer',
    url,
  })

  return Buffer.from(response.data, 'binary')
}
export async function uploadImagesToStorage(
  imagesToUpload: ChartData[],
): Promise<ChartData[]> {
  const promises = imagesToUpload.map(async (result) => {
    const image = await downloadImageToBuffer(result.url)

    await serviceRoleDb.storage.from('satellite').upload(result.name, image)

    return result
  })
  return await Promise.all(promises)
}
