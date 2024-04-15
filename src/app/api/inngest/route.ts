import { serve } from 'inngest/next'

import { config } from '@/config'
import { inngest } from '@/inngest/client'
import { radarPoller } from '@/inngest/cronFunctions/radarPoller'
import { rainPoller } from '@/inngest/cronFunctions/rainPoller'
import { satellitePoller } from '@/inngest/cronFunctions/satellitePoller'
import { upperAirPoller } from '@/inngest/cronFunctions/upperAirPoller'
import { removeImages } from '@/inngest/functions/removeImages'
import { scrapeRegion } from '@/inngest/functions/scrapeRegion'
import { uploadImages } from '@/inngest/functions/uploadImages'

const functions =
  config.environment === 'preview'
    ? []
    : [
        rainPoller,
        radarPoller,
        satellitePoller,
        upperAirPoller,
        removeImages,
        uploadImages,
        scrapeRegion,
      ]
// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
})
