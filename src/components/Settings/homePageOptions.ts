import { balloonLocations } from '@/shared/types/balloonLocations'
import { radarRegions } from '@/shared/types/radarRegions'
import {
  australiaRegions,
  europeRegions,
  nzRegions,
  oceans,
  pacificRegions,
  Region,
  worldRegions,
} from '@/shared/types/region'

export interface HomePageOption {
  path: string
  label: string
}
export interface HomePageGroup {
  label: string
  options: HomePageOption[]
}

// Some regions are in more than one of the menu's groups (Fiji is in the Pacific and
// in the oceans), and each page is listed once.
const listed = new Set<string>()
const forecasts = (regions: Region[]): HomePageOption[] =>
  regions
    .map((region) => ({
      path: `/regions/${region.code}`,
      label: region.name,
    }))
    .filter((option) => {
      if (listed.has(option.path)) return false
      listed.add(option.path)
      return true
    })

/** The pages that can be the page the app opens on, as the menu groups them. */
export const homePageGroups: HomePageGroup[] = [
  {
    label: 'Forecasts',
    options: [
      ...forecasts(nzRegions),
      ...forecasts(australiaRegions),
      ...forecasts(pacificRegions),
      ...forecasts(europeRegions),
      ...forecasts(worldRegions),
      ...forecasts(oceans),
    ],
  },
  {
    label: 'Radar',
    options: Object.entries(radarRegions).map(([code, name]) => ({
      path: `/radar/${code}`,
      label: name,
    })),
  },
  {
    label: 'Upper air',
    options: Object.entries(balloonLocations).map(([code, name]) => ({
      path: `/upperair/${code}`,
      label: name,
    })),
  },
  {
    label: 'Other',
    options: [
      { path: '/satellite', label: 'Satellite' },
      { path: '/saved', label: 'Saved' },
      { path: '/pins', label: 'Pins' },
    ],
  },
]

/** What the app opens on when no home page has been chosen. */
export const DEFAULT_HOME_LABEL = 'New Zealand (default)'
