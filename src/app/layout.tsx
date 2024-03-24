'use client'
import Navbar from '../components/Navbar'
import GoogleTag from '@/components/GoogleTag'
import Footer from '@/components/Footer'
import SubHeader from '@/components/SubHeader'
import './globals.css'
import { Inter } from 'next/font/google'
import React from 'react'
import { Provider } from 'jotai'
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
            <div className="sticky top-0 z-50">
              <Navbar />
              <SubHeader />
            </div>
            {children}
            <Footer />
          </Provider>
        </main>
      </body>
    </html>
  )
}
