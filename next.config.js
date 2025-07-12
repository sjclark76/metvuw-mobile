const withSerwistInit = require("@serwist/next").default;

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === 'development',
});

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
  poweredByHeader: false,
  images: {
    unoptimized: true,
    domains: ['www.metvuw.com'],
  },
}

module.exports = withSerwist(nextConfig);
