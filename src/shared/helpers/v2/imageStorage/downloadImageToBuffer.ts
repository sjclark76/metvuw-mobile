export async function downloadImageToBuffer(url: string) {
  try {
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    return {
      fileBuffer: Buffer.from(arrayBuffer),
      contentType: response.headers.get('content-type') ?? undefined,
    }
  } catch (e) {
    // eslint-disable-next-line
    console.error(`error [downloadImageToBuffer] ${url}`)
    throw e
  }
}
