/* eslint-disable no-console -- a command-line tool: printing is its output */
// See the ads as a visitor abroad would, on this machine: `npm run dev:ads`.
//
// AdSense serves ads only on the site's own domain (and its subdomains), so the
// dev server is opened at local.metvuwmobile.com, which this browser alone maps
// to this machine. The ads are test ads outside production (AdCard's
// data-adtest), so looking at them is not counted as invalid traffic.
//
// - HTTPS, with a self-signed certificate made here: the proxy's cookies
//   (show-ads) are Secure, which a browser keeps over plain HTTP only for
//   localhost. The browser is told to accept it, so nothing is installed.
// - Google's ad hosts are looked up at 1.1.1.1, so a network filter that blocks
//   them (a Pi-hole) does not stop this browser.
import { execFileSync, spawn } from 'node:child_process'
import { Resolver } from 'node:dns/promises'
import { existsSync, mkdirSync } from 'node:fs'

import { chromium, devices } from '@playwright/test'

const HOST = 'local.metvuwmobile.com'
const PORT = 3002
const PAGE = process.argv[2] ?? '/regions/nz'
const KEY = 'certificates/local-ads-key.pem'
const CERT = 'certificates/local-ads.pem'
const AD_HOSTS = [
  'pagead2.googlesyndication.com',
  'googleads.g.doubleclick.net',
  'tpc.googlesyndication.com',
  'partner.googleadservices.com',
  'www.googletagservices.com',
  'ep1.adtrafficquality.google',
  'ep2.adtrafficquality.google',
  'fundingchoicesmessages.google.com',
  's0.2mdn.net',
]

if (!existsSync(CERT)) {
  mkdirSync('certificates', { recursive: true })
  execFileSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-days',
      '825',
      '-subj',
      `/CN=${HOST}`,
      '-addext',
      `subjectAltName=DNS:${HOST}`,
      '-keyout',
      KEY,
      '-out',
      CERT,
    ],
    { stdio: 'ignore' },
  )
}

const server = spawn(
  'npx',
  [
    'next',
    'dev',
    '-p',
    String(PORT),
    '--experimental-https',
    '--experimental-https-key',
    KEY,
    '--experimental-https-cert',
    CERT,
  ],
  { stdio: ['ignore', 'pipe', 'inherit'] },
)
server.stdout.pipe(process.stdout)
await new Promise((resolve, reject) => {
  server.stdout.on('data', (chunk) => {
    if (String(chunk).includes('Ready')) resolve()
  })
  server.on('exit', (code) => reject(new Error(`next dev exited (${code})`)))
})

const resolver = new Resolver()
resolver.setServers(['1.1.1.1'])
// Next listens on IPv6 here; another app may hold the IPv4 port.
const rules = [`MAP ${HOST} [::1]`]
for (const host of AD_HOSTS) {
  const [address] = await resolver.resolve4(host).catch(() => [])
  if (address) rules.push(`MAP ${host} ${address}`)
}

const browser = await chromium.launch({
  headless: false,
  args: [`--host-resolver-rules=${rules.join(',')}`],
})
const context = await browser.newContext({
  ...devices['Pixel 7'],
  ignoreHTTPSErrors: true,
})
const page = await context.newPage()
await page.goto(`https://${HOST}:${PORT}${PAGE}`)
console.log(
  `\nAds preview at https://${HOST}:${PORT}${PAGE}: close the browser to stop.`,
)

browser.on('disconnected', () => {
  server.kill()
  process.exit(0)
})
