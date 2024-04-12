import { Inngest } from 'inngest'

import { config } from '@/config'

// Create a client to send and receive events
export const inngest = new Inngest({
  id: 'metvuw-mobile',
  eventKey: config.inngestEventKey,
})
