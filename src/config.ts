export const config = {
  // Canonical and OpenGraph URLs. Vercel provides the production domain; outside
  // Vercel this is the local dev server (see the `dev` script's port).
  baseUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3002',
  metvuwBaseUrl: 'https://metvuw.com/',
  // The AdSense publisher id, used by the account meta tag, the loader script
  // and every ad unit.
  adsenseClientId:
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-9572839501955022',
}
