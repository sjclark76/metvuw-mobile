const securityHeaders = function () {
  // if (process.env.NODE_ENV !== 'production') {
  //   const index = headers.findIndex(
  //     (value) => value.key === 'Content-Security-Policy'
  //   )
  //
  //   headers[index].value = headers[index].value.replace(
  //     "script-src 'self'",
  //     "script-src 'self' 'unsafe-eval'"
  //   )
  // }
  return [
    {
      key: 'Cache-Control',
      value: 'max-age=31536000',
    },
    {
      key: 'X-XSS-Protection',
      value: '1; mode=block',
    },
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    },
    {
      key: 'X-DNS-Prefetch-Control',
      value: 'on',
    },
    // {
    //   key: 'Content-Security-Policy',
    //   value:
    //     "frame-ancestors 'none'; script-src 'self' 'unsafe-inline' 'sha256-Qa/ZW60QViu4ZpTBXb6ugMmol6ZT2Wq21mwewHgrxPk=' 'sha256-QYgGfxAvFb95Wfr8/J6nXSuhYgCzYgx3g/AeaN1F5J8=' *.googletagmanager.com *.google-analytics.com; img-src 'self' data: https://*  *.metvuw.com *.localhost",
    // },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
  ]
}

const nextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: '/(.*)',
        headers: securityHeaders(),
      },
    ]
  },
  poweredByHeader: false,
  images: {
    domains: ['www.metvuw.com'],
  },
}

module.exports = nextConfig
