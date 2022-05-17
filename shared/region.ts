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
  { name: 'Fiji', code: 'fiji' },
  { name: 'South West Pacific', code: 'swp' },
  { name: 'Fiji - NZ', code: 'ocean' },
  { name: 'Europe', code: 'europe' },
  { name: 'United Kingdom', code: 'uk' },
  { name: 'Estonia', code: 'estonia' },
  { name: 'Turkey', code: 'turkey' },
  { name: 'World', code: 'world' },
  { name: 'South Atlantic', code: 'satlantic' },
  { name: 'North Atlantic', code: 'natlantic' },
  { name: 'USA', code: 'usa' },
  { name: 'Japan', code: 'japan' },
  { name: 'South Africa', code: 'safrica' },
] as const

export function findRegionByCode(code: string): Region | undefined {
  return regions.find((value) => value.code === code)
}

export const nzLinks: Region[] = [
  { name: 'New Zealand', code: 'nz' },
  { name: 'North Island', code: 'nzni' },
  { name: 'South Island', code: 'nzsi' },
]
export const australiaLinks: Region[] = [
  { name: 'Victoria & Tasmania', code: 'victoria' },
  { name: 'New South Wales', code: 'nsw' },
  { name: 'Western Australia', code: 'waussie' },
  { name: 'Perth', code: 'swaussie' },
  { name: 'Queensland', code: 'queensland' },
  { name: 'South Australia', code: 'saussie' },
  { name: 'South East Australia', code: 'seaussie' },
]
export const pacificLinks: Region[] = [
  { name: 'New Caledonia', code: 'newcaledonia' },
  { name: 'Fiji', code: 'fiji' },
  { name: 'South West Pacific', code: 'swp' },
  { name: 'Fiji - NZ', code: 'ocean' },
]
export const europeLinks: Region[] = [
  { name: 'Europe', code: 'europe' },
  { name: 'United Kingdom', code: 'uk' },
  { name: 'Estonia', code: 'estonia' },
  { name: 'Turkey', code: 'turkey' },
]
export const worldLinks: Region[] = [
  { name: 'World', code: 'world' },
  { name: 'South Atlantic', code: 'satlantic' },
  { name: 'North Atlantic', code: 'natlantic' },
  { name: 'USA', code: 'usa' },
  { name: 'Japan', code: 'japan' },
  { name: 'South Africa', code: 'safrica' },
]

export type Region = typeof regions[number]
