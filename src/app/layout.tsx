'use client'
import './globals.css'

import { SpeedInsights } from '@vercel/speed-insights/next'
import { Provider } from 'jotai'
import { Inter } from 'next/font/google'
import React, { useEffect } from 'react'

import GoogleTag from '@/components/GoogleTag'
import { config } from '@/config'

import Navbar from '../components/Navbar'

const inter = Inter({ subsets: ['latin'] })
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('Service Worker registered with scope:', registration.scope)

        // 1. Trigger cache cleanup
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'CLEANUP_CACHE' });
        }

        // 2. Fetch build manifest and send critical assets to the service worker for pre-caching
        fetch('/_next/build-manifest.json')
          .then(res => res.json())
          .then(manifest => {
            const criticalAssets = new Set<string>();
            // Extract assets for the main app and offline page
            const mainAppAssets = manifest.pages['/'];
            const offlinePageAssets = manifest.pages['/offline'];

            if (mainAppAssets) {
              mainAppAssets.forEach((asset: string) => criticalAssets.add(asset));
            }
            if (offlinePageAssets) {
              offlinePageAssets.forEach((asset: string) => criticalAssets.add(asset));
            }
            
            // Send the unique list of assets to the service worker
            if (navigator.serviceWorker.controller) {
               navigator.serviceWorker.controller.postMessage({
                 type: 'CACHE_ASSETS',
                 payload: Array.from(criticalAssets),
               });
            }
          }).catch(error => console.error("Could not fetch build manifest:", error));

      }).catch(error => {
        console.error('Service Worker registration failed:', error);
      });
    }
  }, [])
  return (
    <html lang="en" className="bg-gray-100">
      <head>
        <title>Metvuw Mobile</title>
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href={config.supabaseUrl} />
      </head>
      <GoogleTag />
      <body className={inter.className}>
        <div className="font-sans text-gray-800">
          <SpeedInsights />
          <Provider>
            <header className="sticky top-0 z-30 bg-white shadow-md">
              <Navbar />
            </header>
            <main className="mx-auto dark:bg-stone-600 dark:text-stone-100">
              {children}
            </main>
          </Provider>
        </div>
      </body>
    </html>
  )
}
