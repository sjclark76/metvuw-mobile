self.__precacheManifest = [
  {
    "url": "/_next//_next/build-manifest.json",
    "revision": "32c807b0a3189c44a45e16eba98e555d"
  },
  {
    "url": "/_next//_next/react-loadable-manifest.json",
    "revision": "99914b932bd37a50b983c5e7c90ae93b"
  },
  {
    "url": "/_next//_next/server/middleware-manifest.json",
    "revision": "4f5ca87a6870c96ad6fb0f65adfdac9b"
  },
  {
    "url": "/_next//_next/static/chunks/242-67c4638f23343535.js",
    "revision": "ae355aab51b42656"
  },
  {
    "url": "/_next//_next/static/chunks/framework-91d7f78b5b4003c8.js",
    "revision": "bb1ef0ce123a8622"
  },
  {
    "url": "/_next//_next/static/chunks/main-d2c8830eb0901220.js",
    "revision": "83fe9b8e1f12bb43"
  },
  {
    "url": "/_next//_next/static/chunks/pages/_app-35483f07190e8757.js",
    "revision": "1894d4d43970bab3"
  },
  {
    "url": "/_next//_next/static/chunks/pages/_error-2280fa386d040b66.js",
    "revision": "440bc01e345438ee"
  },
  {
    "url": "/_next//_next/static/chunks/pages/animation-6335d84e307f71e6.js",
    "revision": "87d2881f225c2c7c"
  },
  {
    "url": "/_next//_next/static/chunks/pages/index-532111af1f0b363f.js",
    "revision": "c307b2e67420d472"
  },
  {
    "url": "/_next//_next/static/chunks/pages/regions/[name]-e1e02f48bc6d5a4b.js",
    "revision": "3cf51a2b346291fd"
  },
  {
    "url": "/_next//_next/static/chunks/pages/satellite-b14d8915dbc336cf.js",
    "revision": "baca62d4fada5f9a"
  },
  {
    "url": "/_next//_next/static/chunks/polyfills-5cd94c89d3acac5f.js",
    "revision": "99442aec5788bccac9b2f0ead2afdd6b"
  },
  {
    "url": "/_next//_next/static/chunks/webpack-45f9f9587e6c08e1.js",
    "revision": "d69a2cca823c7d79"
  },
  {
    "url": "/_next//_next/static/css/c9f4e8b4c053ff7f.css",
    "revision": "1894d4d43970bab3"
  },
  {
    "url": "/_next//_next/static/fbE2wUaHakfKp9qq9CssO/_buildManifest.js",
    "revision": "f92b50bbe31355f367f26e8bae92710a"
  },
  {
    "url": "/_next//_next/static/fbE2wUaHakfKp9qq9CssO/_middlewareManifest.js",
    "revision": "fb2823d66b3e778e04a3f681d0d2fb19"
  },
  {
    "url": "/_next//_next/static/fbE2wUaHakfKp9qq9CssO/_ssgManifest.js",
    "revision": "b6652df95db52feb4daf4eca35380933"
  }
];

/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app and you should
 * disable HTTP caching for this file too.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js");

importScripts(
  "/_next/precache-manifest.65992df6974802c6948b48563b038f2c.js"
);

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

workbox.routing.registerRoute(/.gif.*/, new workbox.strategies.CacheFirst({ "cacheName":"images", plugins: [new workbox.expiration.Plugin({ maxAgeSeconds: 43200, maxEntries: 200, purgeOnQuotaError: false })] }), 'GET');
workbox.routing.registerRoute(/^https?.*/, new workbox.strategies.NetworkFirst({ "cacheName":"offlineCache", plugins: [new workbox.expiration.Plugin({ maxEntries: 50, purgeOnQuotaError: false })] }), 'GET');
