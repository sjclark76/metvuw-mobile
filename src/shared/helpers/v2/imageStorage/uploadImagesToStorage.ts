import axios from 'axios'

import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'

async function downloadImageToBuffer(url: string) {
  const response = await axios({
    method: 'GET',
    responseType: 'arraybuffer',
    url,
  })

  console.log('downloaded image', response.headers['content-type'])
  return Buffer.from(response.data, 'binary')
}
export async function uploadImagesToStorage(imagesToUpload: ScrapedImage[]) {
  const promises = imagesToUpload.map(async (imageToScrape) => {
    const image = await downloadImageToBuffer(
      imageToScrape.originalImageURL.href,
    )

    const result = await serviceRoleDb.storage
      .from('images')
      .upload(`${imageToScrape.fullStoragePath}`, image, {
        contentType: 'image/jpeg',
      }) //TODO: get content type...

    return result
  })
  return await Promise.all(promises)
}
