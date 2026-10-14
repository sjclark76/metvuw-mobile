'use client' // Error boundaries must be Client Components

import './globals.css'

import GeneralError from '@/components/GeneralError'

// Replaces the root layout when it fails, so it supplies its own document.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <html lang="en" className="bg-gray-100">
      <body className="font-sans text-gray-800">
        <GeneralError error={error} retry={retry} />
      </body>
    </html>
  )
}
