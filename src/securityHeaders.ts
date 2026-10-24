// The third-party origins come from Google's published guidance for AdSense and
// Google tag (GA4). The site loads both: gtag.js from googletagmanager.com and
// adsbygoogle.js from pagead2.googlesyndication.com (see GoogleTag, GoogleAdSense).
//
// 'unsafe-inline' stays on script-src for now: Next.js streams its hydration data
// in inline scripts, and so do the gtag bootstrap and the favourite-page redirect.
// A nonce would force every page to render dynamically.
const googleScripts = [
  'https://www.googletagmanager.com',
  'https://pagead2.googlesyndication.com',
  'https://partner.googleadservices.com',
  'https://tpc.googlesyndication.com',
  'https://www.googletagservices.com',
  'https://googleads.g.doubleclick.net',
  'https://*.adtrafficquality.google',
]

const googleConnections = [
  'https://*.google-analytics.com',
  'https://*.analytics.google.com',
  'https://*.googletagmanager.com',
  'https://pagead2.googlesyndication.com',
  'https://googleads.g.doubleclick.net',
  'https://*.adtrafficquality.google',
]

const googleFrames = [
  'https://googleads.g.doubleclick.net',
  'https://tpc.googlesyndication.com',
  'https://www.google.com',
  'https://*.adtrafficquality.google',
]

export const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${googleScripts.join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  // Ad creatives come from many hosts, so images may load over any https origin.
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${googleConnections.join(' ')}`,
  `frame-src ${googleFrames.join(' ')}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

export const securityHeaders = [
  // Report-Only until it has been checked against live ads and analytics: the
  // browser console lists anything it would have blocked, and nothing breaks.
  // Rename the key to 'Content-Security-Policy' to enforce it.
  { key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    // Location is allowed for this site alone, for "Add my location"; the browser
    // still asks the visitor first.
    value: 'camera=(), microphone=(), geolocation=(self), payment=()',
  },
]
