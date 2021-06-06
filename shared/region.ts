/*export interface Region {
  name: string
  code: string
}*/

export type RegionType =
  | { name: 'All'; code: 'nz' }
  | { name: 'North Island'; code: 'nzni' }
  | { name: 'South Island'; code: 'nzsi' }
  | { name: 'Victoria & Tasmania'; code: 'victoria' }
  | { name: 'New South Wales'; code: 'nsw' }
  | { name: 'Western Australia'; code: 'waussie' }
  | { name: 'Perth'; code: 'swaussie' }
  | { name: 'Queensland'; code: 'queensland' }
  | { name: 'South Australia'; code: 'saussie' }
  | { name: 'South East Australia'; code: 'seaussie' }
  | { name: 'New Caledonia'; code: 'newcaledonia' }
  | { name: 'Fiji'; code: 'fiji' }
  | { name: 'South West Pacific'; code: 'swp' }
  | { name: 'Fiji - NZ'; code: 'ocean' }
  | { name: 'Europe'; code: 'europe' }
  | { name: 'United Kingdom'; code: 'uk' }
  | { name: 'Estonia'; code: 'estonia' }
  | { name: 'Turkey'; code: 'turkey' }
  | { name: 'World'; code: 'world' }
  | { name: 'South Atlantic'; code: 'satlantic' }
  | { name: 'North Atlantic'; code: 'natlantic' }
  | { name: 'USA'; code: 'usa' }
  | { name: 'Japan'; code: 'japan' }
  | { name: 'South Africa'; code: 'safrica' }
