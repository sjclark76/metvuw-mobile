import Link from 'next/link'
import React from 'react'

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-2 text-center sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="mx-auto max-w-md">
        {/* Modern "No Internet" Icon */}
        <svg
          className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636M12 18.364V22M12 2V5.636M18.364 12H22M2 12h3.636"
          />
        </svg>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
          You&apos;re Offline
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          It looks like you&apos;re not connected to the internet. Please check
          your connection and try again.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-8 py-4 text-lg font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-900"
          >
            Go to Home Page
          </Link>
        </div>
      </div>
    </div>
  )
}
