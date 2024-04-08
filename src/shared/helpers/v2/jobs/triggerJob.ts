import { config } from '@/config'
import serviceRoleDb from '@/shared/db/serviceRoleDb'
import { JobType } from '@/shared/helpers/v2/jobs/types'

export function triggerJob(job: JobType) {
  return serviceRoleDb
    .from('trigger')
    .insert({ operation_name: job, host_name: config.baseUrl })
}

export async function markJobAsCompleted(id: number) {
  return serviceRoleDb
    .from('trigger')
    .update({ is_completed: true })
    .eq('id', id)
}
