export const config = {
  baseUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://valid-factual-barnacle.ngrok-free.app',
  cloudFrontUrl: 'https://metvuw.com/',
  metvuwBaseUrl: 'https://metvuw.com/', //https://dpucyvo9dklo9.cloudfront.net',
  s3: {
    accessKey: process.env.ACCESS_KEY,
    bucketName: process.env.BUCKET_NAME ?? 'metvuw-mobile',
    region: process.env.S3_REGION,
    secret: process.env.SECRET_KEY,
  },
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supbabaseBucketName: process.env.SUPABASE_BUCKET_NAME ?? 'dev',
  inngestEventKey: process.env.INNGEST_EVENT_KEY ?? '',
  environment: process.env.VERCEL_ENV,
}
