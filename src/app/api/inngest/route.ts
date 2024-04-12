import { serve } from 'inngest/next'

import { inngest } from '@/inngest/client'
import { minutePoller } from '@/inngest/cronFunctions'
import { removeImages, uploadImages } from '@/inngest/functions'

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [minutePoller, removeImages, uploadImages],
})
