import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-stone-100">
        Page not found
      </h2>
      <p className="text-gray-600 dark:text-stone-300">
        We couldn&apos;t find the page you were looking for.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center justify-center rounded bg-sky-700 px-5 font-semibold text-white hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
      >
        Go to the home page
      </Link>
    </div>
  )
}
