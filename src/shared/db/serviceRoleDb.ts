import { createClient } from '@supabase/supabase-js'

import { config } from '@/config'
import { Database } from '@/shared/db/database.types'

const serviceRoleDb = createClient<Database>(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  {
    auth: { persistSession: false },
  },
)

export default serviceRoleDb
