import { config } from '@/config'
import { radarRegions } from '@/shared/types/radarRegions'
import { regions } from '@/shared/types/region'

import sitemap from './sitemap'

const paths = () =>
  sitemap().map((entry) => entry.url.replace(config.baseUrl, ''))

// The hand-written public/sitemap.xml this replaces listed exactly these pages.
const previouslyListed = [
  '/',
  '/offline',
  '/satellite',
  ...[
    'nz',
    'nzni',
    'nzsi',
    'victoria',
    'nsw',
    'waussie',
    'swaussie',
    'queensland',
    'saussie',
    'seaussie',
    'newcaledonia',
    'swp',
    'europe',
    'uk',
    'estonia',
    'turkey',
    'world',
    'usa',
    'japan',
    'safrica',
    'ocean',
    'pacific',
    'fiji',
    'spacific',
    'pitcairn',
    'natlantic',
    'satlantic',
  ].map((code) => `/regions/${code}`),
  ...['nl', 'ak', 'bp', 'mh', 'np', 'wn', 'ch', 'wl', 'nv'].map(
    (code) => `/radar/${code}`,
  ),
  '/upperair',
  '/upperair/93112',
  '/upperair/93417',
  '/upperair/93844',
]

describe('sitemap', () => {
  test('lists the same pages as the hand-written sitemap did', () => {
    expect([...paths()].sort()).toEqual([...previouslyListed].sort())
  })

  test('lists every region, so a new one is never forgotten', () => {
    expect(paths()).toEqual(
      expect.arrayContaining(regions.map((r) => `/regions/${r.code}`)),
    )
    expect(paths()).toEqual(
      expect.arrayContaining(
        Object.keys(radarRegions).map((code) => `/radar/${code}`),
      ),
    )
  })

  test('lists each page once', () => {
    expect(new Set(paths()).size).toBe(paths().length)
  })

  test('uses absolute URLs on the site origin', () => {
    for (const { url } of sitemap()) {
      expect(url.startsWith(config.baseUrl)).toBe(true)
    }
  })

  test('ranks the home page first', () => {
    const [home, ...others] = sitemap()

    expect(home.url).toBe(`${config.baseUrl}/`)
    expect(home.priority).toBe(1)
    expect(others.every((e) => e.priority === 0.8)).toBe(true)
  })
})
