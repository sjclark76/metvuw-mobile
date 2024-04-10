import { config } from '@/config'

const generateTriggerCode = (name: string) =>
  `${config.supbabaseBucketName}-${name}-${Date.now()}`
export default generateTriggerCode
