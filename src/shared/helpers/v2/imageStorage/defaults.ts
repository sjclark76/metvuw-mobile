import { SearchOptions } from '@supabase/storage-js/src/lib/types'

export const defaultSearchOptions: SearchOptions = {
  limit: 200,
  offset: 0,
  search: '',
  sortBy: {
    column: 'name',
    order: 'asc',
  },
}
