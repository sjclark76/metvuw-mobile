'use client' // Error boundaries must be Client Components

import './fonts'
import './globals.css'

import GeneralError from '@/components/GeneralError'
import { themeScript } from '@/components/ThemeToggle/themeScript'

// Replaces the root layout when it fails, so it supplies its own document.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <html lang="en" className="bg-paper" suppressHydrationWarning>
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body className="bg-paper text-ink font-sans">
        <GeneralError error={error} retry={retry} />
      </body>
    </html>
  )
}
