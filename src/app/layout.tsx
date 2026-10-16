import './globals.css'

import React from 'react'

import FavoritePageRedirect from '@/components/FavoritePageRedirect/FavoritePageRedirect'
import { favoritePageRedirectScript } from '@/components/FavoritePageRedirect/favoritePageRedirectScript'
import { GoogleAdSense } from '@/components/GoogleAdSense'
import GoogleTag from '@/components/GoogleTag'
import { Providers } from '@/components/Providers/Providers'
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
        <meta name="google-adsense-account" content={config.adsenseClientId} />
        {/* A plain inline script blocks parsing, so it runs before the page
            paints. next/script's beforeInteractive only queues the script for
            Next's runtime, which runs after the page can already be visible. */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: favoritePageRedirectScript }}
        />
      </head>
      <body className="font-sans text-gray-800">
        <GoogleTag />
        <GoogleAdSense />
        <div className="font-sans text-gray-800">
          <Providers>
            <header className="sticky top-0 z-30 bg-white shadow-md print:hidden">
              <Navbar />
            </header>
            <FavoritePageRedirect />
            <main className="mx-auto dark:bg-stone-600 dark:text-stone-100">
              {children}
            </main>
          </Providers>
        </div>
      </body>
    </html>
  )
}
