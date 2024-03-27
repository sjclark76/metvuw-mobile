export const config = {
  baseUrl: process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3002',
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
}
