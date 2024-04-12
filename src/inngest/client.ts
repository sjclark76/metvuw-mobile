import { EventSchemas, Inngest } from 'inngest'

import { config } from '@/config'
import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'
import { ChartType } from '@/shared/types/ChartType'
import { Region } from '@/shared/types/region'
import { StorageImage } from '@/shared/types/storageImage'

type ImageRemoval = {
  data: {
    bucket: string
    toRemove: StorageImage[]
  }
}
type ImageUpload = {
  data: {
    bucket: string
    chartType: ChartType
    toUpload: ScrapedImage[]
  }
}

export type RegionScrape = {
  data: {
    bucket: string
    region: Region
  }
}

export type Events = {
  'images/remove': ImageRemoval
  'images/upload': ImageUpload
  'scrape/region': RegionScrape
}

export const inngest = new Inngest({
  id: 'metvuw-mobile',
  eventKey: config.inngestEventKey,
  schemas: new EventSchemas().fromRecord<Events>(),
})
