import axios from 'axios'

export async function downloadImageToBuffer(url: string) {
  const { data, headers } = await axios.get(url, {
    responseType: 'arraybuffer',
  })
  return {
    fileBuffer: Buffer.from(data, 'binary'),
    contentType: headers['content-type'],
  }
}
