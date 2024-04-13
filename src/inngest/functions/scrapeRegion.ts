import { inngest } from '@/inngest/client'
import {
  calculateImagesToDownload,
  calculateImagesToRemove,
  retrieveImagesFromStorage,
} from '@/shared/helpers/v2/imageStorage'
import { scrapeRainImages } from '@/shared/helpers/v2/screenScraper'

export const scrapeRegion = inngest.createFunction(
  { id: 'scrape-region', concurrency: { scope: 'account', limit: 20 } },
  { event: 'scrape/region' },
  async ({ event, step }) => {
    const { bucket, region } = event.data

    const newImages = await step.run(
      `scraping rain images for ${region.name}`,
      async () => {
        return await scrapeRainImages(region)
      },
    )

    const existingImages = await step.run(
      'retrieving existing images',
      async () => {
        return await retrieveImagesFromStorage(`images/rain/${region.code}`)
      },
    )

    const toRemove = await step.run(
      'calculating images to remove',
      async () => {
        // @ts-ignore
        return calculateImagesToRemove(newImages, existingImages)
      },
    )

    const toDownload = await step.run('calculating images to upload', () => {
      // @ts-ignore
      return calculateImagesToDownload(newImages, existingImages)
    })

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
