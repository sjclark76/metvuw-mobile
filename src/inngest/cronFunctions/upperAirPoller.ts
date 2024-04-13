import { config } from '@/config'
import { inngest } from '@/inngest/client'
import { defaultPollerTime } from '@/inngest/cronFunctions/pollingCronSchedule'
import {
  calculateImagesToDownload,
  calculateImagesToRemove,
  retrieveImagesFromStorage,
} from '@/shared/helpers/v2/imageStorage'
import { scrapeUpperAirImages } from '@/shared/helpers/v2/screenScraper'

export const upperAirPoller = inngest.createFunction(
  { id: 'upper-air-poller' }, // The name of your function, used for observability.
  defaultPollerTime,

  // This function will be called on the schedule above
  async ({ step }) => {
    const newImages = await scrapeUpperAirImages()

    const existingImages = await retrieveImagesFromStorage('images/upper-air')

    const toRemove = calculateImagesToRemove(newImages, existingImages)

    const toDownload = calculateImagesToDownload(newImages, existingImages)

    if (toRemove.length > 0) {
      await step.sendEvent('dispatch-remove-images-event', {
        name: 'images/remove',
        data: {
          bucket: config.supbabaseBucketName,
          toRemove,
        },
      })
    }

    if (toDownload.length > 0) {
      await step.sendEvent('dispatch-upload-images-event', {
        name: 'images/upload',
        data: {
          bucket: config.supbabaseBucketName,
          chartType: 'Upper Air',
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
