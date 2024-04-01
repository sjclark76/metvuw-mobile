'use client'
import './globals.css'

import { Provider } from 'jotai'
import { Inter } from 'next/font/google'
import React from 'react'

import Footer from '@/components/Footer'
import GoogleTag from '@/components/GoogleTag'

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
      <GoogleTag />
      <body className={inter.className}>
        <main className="relative">
          <Provider>
            <div className="sticky top-0 z-20">
              <Navbar />
            </div>

            {children}
            <Footer />
          </Provider>
        </main>
      </body>
    </html>
  )
}
