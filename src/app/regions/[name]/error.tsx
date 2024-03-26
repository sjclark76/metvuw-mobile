'use client' // Error components must be Client Components

import GeneralError from '@/components/GeneralError'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <GeneralError error={error} reset={reset} />
}
