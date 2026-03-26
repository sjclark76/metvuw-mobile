import { config } from '@/config'
import { inngest, RegionScrape } from '@/inngest/client'
import { Events } from '@/inngest/client'
import { defaultPollerTime } from '@/inngest/cronFunctions/pollingCronSchedule'
import { regions } from '@/shared/types/region'

export const rainPoller = inngest.createFunction(
  { id: 'rain-poller', triggers: [defaultPollerTime] },
  async ({ step }) => {
    const events: RegionScrape[] = regions.map<Events['scrape/region']>(
      (region) => ({
        name: 'scrape/region',
        data: { bucket: config.supbabaseBucketName, region: region },
      }),
    )

    // @ts-ignore
    await step.sendEvent('scrape-rain-region', events)
  },
)
