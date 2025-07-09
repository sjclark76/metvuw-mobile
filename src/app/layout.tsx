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
