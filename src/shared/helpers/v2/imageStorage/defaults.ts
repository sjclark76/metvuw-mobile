import { SearchOptions } from '@supabase/storage-js'

export const defaultSearchOptions: SearchOptions = {
  limit: 200,
  offset: 0,
  search: '',
  sortBy: {
    column: 'name',
    order: 'asc',
  },
}
