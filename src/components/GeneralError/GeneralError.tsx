'use client' // Error components must be Client Components

import { useEffect } from 'react'

import StatusMessage, { actionClasses } from '@/components/StatusMessage'

export function GeneralError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    // eslint-disable-next-line no-console
    console.error(error)
  }, [error])

  // The home link is a plain anchor on purpose: a full page load also recovers
  // from broken client state, and this component renders in global-error, outside
  // the layout, where client-side navigation is not available.
  return (
    <StatusMessage
      role="alert"
      eyebrow="Error"
      title="Something went wrong"
      actions={
        <>
          <button
            type="button"
            // Re-fetches and re-renders the failed segment (reset() would only
            // clear the error state without re-running the data fetch).
            onClick={() => retry()}
            className={actionClasses.primary}
          >
            Try again
          </button>
          <a href="/" className={actionClasses.secondary}>
            Go to the home page
          </a>
        </>
      }
    >
      We couldn&apos;t load the forecast. This is usually temporary, so try
      again in a moment.
    </StatusMessage>
  )
}
