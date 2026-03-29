'use client'
import './globals.css'

import { Provider } from 'jotai'
import React from 'react'
import { Toaster } from 'react-hot-toast'

import FavoritePageRedirect from '@/components/FavoritePageRedirect/FavoritePageRedirect'
import { GoogleAdSense } from '@/components/GoogleAdSense'
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
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href={config.supabaseUrl} />
        <meta name="google-adsense-account" content="ca-pub-9572839501955022" />
      </head>
      <GoogleTag />
      <GoogleAdSense />
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
