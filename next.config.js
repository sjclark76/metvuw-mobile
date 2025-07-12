const withSerwistInit = require("@serwist/next").default;

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === 'development',
});

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
    {
      key: "Access-Control-Allow-Credentials",
      value: "true",
    },
    {
      key: "Access-Control-Allow-Origin",
      value: "*",
    },
    {
      key: "Access-Control-Allow-Methods",
      value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
    },
    {
      key: "Access-Control-Allow-Headers",
      value:
        "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
    },
  ]
}

const nextConfig = {
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      const ignored = Array.isArray(config.watchOptions.ignored)
        ? config.watchOptions.ignored
        : [config.watchOptions.ignored].filter(Boolean);

      config.watchOptions.ignored = [
        ...ignored,
        "**/public/sw.js",
        "**/public/sw.js.map",
      ];
    }
    return config;
  },
  /* config options here */
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: '/((?!offline).*)',
        headers: securityHeaders(),
      },
    ]
  },
  poweredByHeader: false,
  images: {
    unoptimized: true,
    domains: ['www.metvuw.com'],
  },
}

module.exports = withSerwist(nextConfig);
