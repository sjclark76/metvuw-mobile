export const config = {
  baseUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://valid-factual-barnacle.ngrok-free.app',
  cloudFrontUrl: 'https://metvuw.com/',
  metvuwBaseUrl: 'https://metvuw.com/', //https://dpucyvo9dklo9.cloudfront.net',
}
