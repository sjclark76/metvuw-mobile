import type { MetadataRoute } from 'next'

import { config } from '@/config'
import { balloonLocations } from '@/shared/types/balloonLocations'
import { radarRegions } from '@/shared/types/radarRegions'
import { regions } from '@/shared/types/region'

// Served at /sitemap.xml. Built from the same lists the app routes on, so a
// new region, radar or balloon station is listed without anyone remembering to.
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '/',
    '/satellite',
    ...regions.map((region) => `/regions/${region.code}`),
    ...Object.keys(radarRegions).map((code) => `/radar/${code}`),
    '/upperair',
    ...Object.keys(balloonLocations).map((code) => `/upperair/${code}`),
  ]

  return paths.map((path) => ({
    url: `${config.baseUrl}${path}`,
    priority: path === '/' ? 1 : 0.8,
  }))
}
