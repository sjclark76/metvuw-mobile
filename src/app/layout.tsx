import './fonts'
import './globals.css'

import React from 'react'

import FavoritePageRedirect from '@/components/FavoritePageRedirect/FavoritePageRedirect'
import { favoritePageRedirectScript } from '@/components/FavoritePageRedirect/favoritePageRedirectScript'
import { GoogleAdSense } from '@/components/GoogleAdSense'
import GoogleTag from '@/components/GoogleTag'
import { Providers } from '@/components/Providers/Providers'
import { UpdateNotification } from '@/components/UpdateNotification'
import { config } from '@/config'

import Navbar from '../components/Navbar'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-paper">
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
      <body className="bg-paper text-ink font-sans">
        <GoogleTag />
        <GoogleAdSense />
        <div className="text-ink font-sans">
          <Providers>
            <header className="bg-bar sticky top-0 z-30 print:hidden">
              <Navbar />
            </header>
            <FavoritePageRedirect />
            <UpdateNotification />
            <main className="mx-auto">{children}</main>
          </Providers>
        </div>
      </body>
    </html>
  )
}
