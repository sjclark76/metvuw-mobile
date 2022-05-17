export const config = {
  baseUrl: process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3002',
  metvuwBaseUrl: 'https://www.metvuw.com/',
  cloudFrontUrl: 'https://dpucyvo9dklo9.cloudfront.net',
  bucketName: process.env.BUCKET_NAME,
}
