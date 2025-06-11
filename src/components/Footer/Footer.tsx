import React from 'react'

export const Footer = () => (
  // Remove "fixed bottom-0 left-0 z-10 w-full" to allow the flexbox layout to control the footer's position.
  <footer className="bg-gray-50 px-0.5 py-1.5 shadow-inner filter dark:bg-stone-700">
    <h2 className="text-center text-sm font-medium text-gray-800 dark:text-stone-100">
      &copy; metvuw.com
    </h2>
  </footer>
)
