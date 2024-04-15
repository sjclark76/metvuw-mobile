import { getCompressorForChart } from '@/shared/helpers/v2/imageCompression/getCompressorForChart'
import { downloadImageToBuffer } from '@/shared/helpers/v2/imageStorage/downloadImageToBuffer'
import { uploadImage } from '@/shared/helpers/v2/imageStorage/uploadImagesToStorage'
import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'
import { ChartType } from '@/shared/types/ChartType'

export async function downloadAndUpload(
  bucket: string,
  chartType: ChartType,
  { originalImageURL, smallImageStoragePath, fullStoragePath }: ScrapedImage,
) {
  const image = await downloadImageToBuffer(originalImageURL)

  const { primary, small } = getCompressorForChart(chartType)

  const imageToUpload = await primary(image.fileBuffer)

  if (small && smallImageStoragePath) {
    const smallImage = await small(image.fileBuffer)
    await uploadImage(bucket, smallImageStoragePath, smallImage)
  }
  return uploadImage(bucket, fullStoragePath, imageToUpload)
}
