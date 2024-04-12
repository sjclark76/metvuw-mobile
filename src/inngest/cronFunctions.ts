import { config } from '@/config'
import { inngest } from '@/inngest/client'
import { EventNames } from '@/inngest/functions'
import {
  calculateImagesToDownload,
  calculateImagesToRemove,
  retrieveImagesFromStorage,
} from '@/shared/helpers/v2/imageStorage'
import { scrapeRadarImages } from '@/shared/helpers/v2/screenScraper'

export const minutePoller = inngest.createFunction(
  { id: 'radar-poller' }, // The name of your function, used for observability.
  { cron: '*/5 * * * *' }, // The cron syntax for the function. TZ= is optional.

  // This function will be called on the schedule above
  async ({ step }) => {
    const newImages = await step.run('scraping radar images', async () => {
      return await scrapeRadarImages()
    })

    const existingImages = await step.run(
      'retrieving existing images',
      async () => {
        return await retrieveImagesFromStorage('images/radar')
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

    await step.sendEvent('dispatch-remove-images-event', {
      name: EventNames.removeImages,
      data: {
        bucket: config.supbabaseBucketName,
        toRemove,
      },
    })

    await step.sendEvent('dispatch-upload-images-event', {
      name: EventNames.uploadImages,
      data: {
        bucket: config.supbabaseBucketName,
        toDownload,
      },
    })

    return {
      toRemove,
      toDownload,
    }
  },
)
