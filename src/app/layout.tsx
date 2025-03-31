'use client'
import './globals.css'

import { SpeedInsights } from '@vercel/speed-insights/next'
import { Provider } from 'jotai'
import { Inter } from 'next/font/google'
import React from 'react'

import Footer from '@/components/Footer'
import GoogleTag from '@/components/GoogleTag'
import { config } from '@/config'

import Navbar from '../components/Navbar'

const inter = Inter({ subsets: ['latin'] })
export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>Metvuw Mobile</title>
        <link rel="preconnect" href={config.supabaseUrl} />
      </head>
      <GoogleTag />
      <body className={inter.className}>
        <main className="relative min-h-screen bg-white dark:bg-stone-600 dark:text-stone-100">
          <SpeedInsights />
          <Provider>
            <div className="sticky top-0 z-20">
              <Navbar />
            </div>

            {children}
          </Provider>
        </main>
        <Footer />
      </body>
    </html>
  )
}
