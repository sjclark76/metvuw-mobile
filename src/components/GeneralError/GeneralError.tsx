'use client' // Error components must be Client Components

import { useEffect } from 'react'

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

  return (
    <div
      role="alert"
      className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center"
    >
      <h2 className="text-xl font-semibold text-gray-800 dark:text-stone-100">
        Something went wrong
      </h2>
      <p className="text-gray-600 dark:text-stone-300">
        We couldn&apos;t load the forecast. This is usually temporary, so try
        again in a moment.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          // Re-fetches and re-renders the failed segment (reset() would only
          // clear the error state without re-running the data fetch).
          onClick={() => retry()}
          className="inline-flex min-h-11 items-center justify-center rounded bg-sky-700 px-5 font-semibold text-white hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
        >
          Try again
        </button>
        {/* A full page load is intentional: it also recovers from broken client
            state, and this component renders in global-error, outside the layout. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded border border-gray-400 px-5 font-semibold text-gray-800 hover:bg-gray-100 dark:text-stone-100 dark:hover:bg-stone-700"
        >
          Go to the home page
        </a>
      </div>
    </div>
  )
}
