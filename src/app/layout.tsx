'use client'
import './globals.css'

import { Provider } from 'jotai'
import React from 'react'
import { Toaster } from 'react-hot-toast'

import Script from 'next/script'

import FavoritePageRedirect from '@/components/FavoritePageRedirect/FavoritePageRedirect'
import GoogleTag from '@/components/GoogleTag'
import { config } from '@/config'

import Navbar from '../components/Navbar'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-gray-100">
      <head>
        <title>Metvuw Mobile</title>
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href={config.supabaseUrl} />
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <Script
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <GoogleTag />
      <body className="font-sans text-gray-800">
        <Toaster />
        <div className="font-sans text-gray-800">
          <Provider>
            <header className="sticky top-0 z-30 bg-white shadow-md print:hidden">
              <Navbar />
            </header>
            <FavoritePageRedirect />
            <main className="mx-auto dark:bg-stone-600 dark:text-stone-100">
              {children}
            </main>
          </Provider>
        </div>
      </body>
    </html>
  )
}
