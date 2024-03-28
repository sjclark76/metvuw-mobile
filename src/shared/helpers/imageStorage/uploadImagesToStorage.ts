import axios from 'axios'

import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { ChartData } from '@/shared/types/chartData'

async function downloadImageToBuffer(url: string) {
  const response = await axios({
    method: 'GET',
    responseType: 'arraybuffer',
    url,
  })

  console.log('downloaded image', response.headers['content-type'])
  return Buffer.from(response.data, 'binary')
}
export async function uploadImagesToStorage(
  imagesToUpload: ChartData[],
): Promise<ChartData[]> {
  const promises = imagesToUpload.map(async (result) => {
    const image = await downloadImageToBuffer(result.url)

    const { error } = await serviceRoleDb.storage
      .from('images')
      .upload(result.path, image, { contentType: 'image/jpeg' })

    if (error) {
      console.error(error)
    }

    return result
  })
  return await Promise.all(promises)
}
