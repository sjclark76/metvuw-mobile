'use client'
import './globals.css'

import { Provider } from 'jotai'
import React, { useEffect } from 'react'
import { toast, Toaster } from 'react-hot-toast'

import GoogleTag from '@/components/GoogleTag'
import { config } from '@/config'

import Navbar from '../components/Navbar'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'OFFLINE') {
          toast.error('You are offline. Showing cached page.')
        }
      }
      navigator.serviceWorker.addEventListener('message', handleMessage)
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage)
      }
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
      <body className="font-sans text-gray-800">
        <Toaster />
        <div className="font-sans text-gray-800">
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
