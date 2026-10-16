export const regions = [
  { name: 'New Zealand', code: 'nz' },
  { name: 'North Island', code: 'nzni' },
  { name: 'South Island', code: 'nzsi' },
  { name: 'Victoria & Tasmania', code: 'victoria' },
  { name: 'New South Wales', code: 'nsw' },
  { name: 'Western Australia', code: 'waussie' },
  { name: 'Perth', code: 'swaussie' },
  { name: 'Queensland', code: 'queensland' },
  { name: 'South Australia', code: 'saussie' },
  { name: 'South East Australia', code: 'seaussie' },
  { name: 'New Caledonia', code: 'newcaledonia' },
  { name: 'South West Pacific', code: 'swp' },
  { name: 'Europe', code: 'europe' },
  { name: 'United Kingdom', code: 'uk' },
  { name: 'Estonia', code: 'estonia' },
  { name: 'Turkey', code: 'turkey' },
  { name: 'World', code: 'world' },
  { name: 'USA', code: 'usa' },
  { name: 'Japan', code: 'japan' },
  { name: 'South Africa', code: 'safrica' },

  { code: 'ocean', name: 'New Zealand to Fiji' },
  { code: 'pacific', name: 'Pacific Islands' },
  { code: 'fiji', name: 'Fiji Islands' },
  { code: 'spacific', name: 'South Pacific' },
  { code: 'pitcairn', name: 'Pitcairn Island' },
  { code: 'natlantic', name: 'North Atlantic' },
  { code: 'satlantic', name: 'South Atlantic' },
] as const

export const getByRegionCode = (code: string) => {
  const region = findRegionByCode(code)

  if (!region) {
    throw new Error(`invalid country code code: ${code} `)
  }

  return region
}
export const findRegionByCode = (code: string): Region | undefined =>
  regions.find((value) => value.code === code)

export type Region = (typeof regions)[number]
export type RegionCode = Region['code']

// The groups the navigation menus show, in menu order. They are looked up in
// `regions`, so a name or code is only ever written once.
const inOrder = (...codes: RegionCode[]): Region[] =>
  codes.map((code) => getByRegionCode(code))

export const nzRegions = inOrder('nz', 'nzni', 'nzsi')
export const australiaRegions = inOrder(
  'victoria',
  'nsw',
  'waussie',
  'swaussie',
  'queensland',
  'saussie',
  'seaussie',
)
export const pacificRegions = inOrder('newcaledonia', 'fiji', 'swp')
export const europeRegions = inOrder('europe', 'uk', 'estonia', 'turkey')
export const worldRegions = inOrder(
  'world',
  'satlantic',
  'natlantic',
  'usa',
  'japan',
  'safrica',
)
export const oceans = inOrder(
  'ocean',
  'pacific',
  'fiji',
  'spacific',
  'pitcairn',
  'natlantic',
  'satlantic',
)
