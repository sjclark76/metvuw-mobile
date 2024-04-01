import axios from 'axios'

import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'

async function downloadImageToBuffer(url: string) {
  const { data, headers } = await axios.get(url, {
    responseType: 'arraybuffer',
  })
  return {
    fileBuffer: Buffer.from(data, 'binary'),
    contentType: headers['content-type'],
  }
}

export async function uploadImagesToStorage(imagesToUpload: ScrapedImage[]) {
  return Promise.all(
    imagesToUpload.map(async ({ originalImageURL, fullStoragePath }) => {
      const image = await downloadImageToBuffer(originalImageURL.href)
      return serviceRoleDb.storage
        .from('images')
        .upload(fullStoragePath, image.fileBuffer, {
          contentType: image.contentType,
        })
    }),
  )
}
