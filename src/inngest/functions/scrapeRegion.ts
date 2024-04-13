import { inngest } from '@/inngest/client'
import {
  calculateImagesToDownload,
  calculateImagesToRemove,
  retrieveImagesFromStorage,
} from '@/shared/helpers/v2/imageStorage'
import { scrapeRainImages } from '@/shared/helpers/v2/screenScraper'

export const scrapeRegion = inngest.createFunction(
  {
    id: 'scrape-region',
    concurrency: { scope: 'account', limit: 10, key: 'metvuw' },
  },
  { event: 'scrape/region' },
  async ({ event, step }) => {
    const { bucket, region } = event.data

    const newImages = await scrapeRainImages(region)

    const existingImages = await retrieveImagesFromStorage(
      `images/rain/${region.code}`,
    )

    const toRemove = calculateImagesToRemove(newImages, existingImages)

    const toDownload = calculateImagesToDownload(newImages, existingImages)

    if (toRemove.length > 0) {
      await step.sendEvent('dispatch-remove-images-event', {
        name: 'images/remove',
        data: {
          bucket: bucket,
          toRemove,
        },
      })
    }

    if (toDownload.length > 0) {
      await step.sendEvent('dispatch-upload-images-event', {
        name: 'images/upload',
        data: {
          bucket: bucket,
          chartType: 'Rain',
          toUpload: toDownload,
        },
      })
    }

    return {
      toRemove,
      toDownload,
    }
  },
)
