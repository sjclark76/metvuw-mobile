import axios from 'axios'

export async function downloadImageToBuffer(url: string) {
  try {
    const { data, headers } = await axios.get(url, {
      responseType: 'arraybuffer',
    })
    return {
      fileBuffer: Buffer.from(data, 'binary'),
      contentType: headers['content-type'],
    }
  } catch (e) {
    // eslint-disable-next-line
    console.error(`error [downloadImageToBuffer] ${url}`)
    throw e
  }
}
