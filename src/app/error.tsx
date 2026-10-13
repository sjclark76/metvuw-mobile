'use client' // Error boundaries must be Client Components

import GeneralError from '@/components/GeneralError'

// Catches errors thrown while loading or rendering any page below the root
// layout (for example when metvuw.com is down), so the navbar stays usable.
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return <GeneralError error={error} retry={retry} />
}
