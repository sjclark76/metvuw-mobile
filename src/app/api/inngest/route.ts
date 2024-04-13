import { serve } from 'inngest/next'

import { inngest } from '@/inngest/client'
import { radarPoller } from '@/inngest/cronFunctions/radarPoller'
import { rainPoller } from '@/inngest/cronFunctions/rainPoller'
import { satellitePoller } from '@/inngest/cronFunctions/satellitePoller'
import { upperAirPoller } from '@/inngest/cronFunctions/upperAirPoller'
import { removeImages } from '@/inngest/functions/removeImages'
import { scrapeRegion } from '@/inngest/functions/scrapeRegion'
import { uploadImageFunc, uploadImages } from '@/inngest/functions/uploadImages'

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    rainPoller,
    radarPoller,
    satellitePoller,
    upperAirPoller,
    removeImages,
    uploadImageFunc,
    uploadImages,
    scrapeRegion,
  ],
})
