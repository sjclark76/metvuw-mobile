import { config } from '@/config'

export const everyHalfHour = { cron: '*/30 * * * *' }
export const everyTwoHours = { cron: '0 */2 * * *' }

export const everyEightHours = { cron: '0 */8 * * *' }
export const never = { cron: '59 23 31 12 * 1970' }

export const defaultPollerTime =
  config.environment === 'preview' ? never : everyEightHours
