export const config = {
  baseUrl: process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3002',
  metvuwBaseUrl: 'https://www.metvuw.com/',
  cloudFrontUrl: 'https://www.metvuw.com/', //https://dpucyvo9dklo9.cloudfront.net',
  s3: {
    region: process.env.S3_REGION,
    accessKey: process.env.ACCESS_KEY,
    secret: process.env.SECRET_KEY,
    bucketName: process.env.BUCKET_NAME ?? 'metvuw-mobile',
  },
}
