// type RegionCode =
//   | 'nz'
//   | 'nzni'
//   | 'nzsi'
//   | 'victoria'
//   | 'nsw'
//   | 'waussie'
//   | 'swaussie'
//   | 'queensland'
//   | 'saussie'
//   | 'seaussie'
//   | 'newcaledonia'
//   | 'fiji'
//   | 'swp'
//   | 'ocean'
//   | 'europe'
//   | 'uk'
//   | 'estonia'
//   | 'turkey'
//   | 'world'
//   | 'satlantic'
//   | 'natlantic'
//   | 'usa'
//   | 'japan'
//   | 'safrica'

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

export const nzRegions: Region[] = [
  { name: 'New Zealand', code: 'nz' },
  { name: 'North Island', code: 'nzni' },
  { name: 'South Island', code: 'nzsi' },
]
export const australiaRegions: Region[] = [
  { name: 'Victoria & Tasmania', code: 'victoria' },
  { name: 'New South Wales', code: 'nsw' },
  { name: 'Western Australia', code: 'waussie' },
  { name: 'Perth', code: 'swaussie' },
  { name: 'Queensland', code: 'queensland' },
  { name: 'South Australia', code: 'saussie' },
  { name: 'South East Australia', code: 'seaussie' },
]
export const pacificRegions: Region[] = [
  { name: 'New Caledonia', code: 'newcaledonia' },
  { code: 'fiji', name: 'Fiji Islands' },
  { name: 'South West Pacific', code: 'swp' },
  // { name: 'Fiji - NZ', code: 'ocean' },
]
export const europeRegions: Region[] = [
  { name: 'Europe', code: 'europe' },
  { name: 'United Kingdom', code: 'uk' },
  { name: 'Estonia', code: 'estonia' },
  { name: 'Turkey', code: 'turkey' },
]
export const worldRegions: Region[] = [
  { name: 'World', code: 'world' },
  { name: 'South Atlantic', code: 'satlantic' },
  { name: 'North Atlantic', code: 'natlantic' },
  { name: 'USA', code: 'usa' },
  { name: 'Japan', code: 'japan' },
  { name: 'South Africa', code: 'safrica' },
]

export const oceans: Region[] = [
  { code: 'ocean', name: 'New Zealand to Fiji' },
  { code: 'pacific', name: 'Pacific Islands' },
  { code: 'fiji', name: 'Fiji Islands' },
  { code: 'spacific', name: 'South Pacific' },
  { code: 'pitcairn', name: 'Pitcairn Island' },
  { code: 'natlantic', name: 'North Atlantic' },
  { code: 'satlantic', name: 'South Atlantic' },
]

export type Region = (typeof regions)[number]
