import React from 'react';
import NoForecast from '@/components/NoForecast';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-4xl font-bold mb-4">You are Offline</h1>
      <p className="text-lg mb-8">
        The page you are trying to access has not been saved for offline use.
      </p>
      <NoForecast message="Please check your internet connection and try again." />
      <a
        href="/"
        className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go to Home Page
      </a>
    </div>
  );
}
