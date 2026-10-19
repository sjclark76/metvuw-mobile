import type { Metadata } from 'next'

import { SavedPagesList } from '@/components/SavedPages/SavedPagesList'

export const metadata: Metadata = {
  title: 'metvuw mobile | Saved for offline',
  // Nothing here is public: it is whatever this device has saved.
  robots: { index: false },
}

export default function SavedPage() {
  return (
    <section className="mx-auto max-w-176 px-4 py-8 md:px-0">
      <p className="text-ink-soft font-mono text-xs tracking-[0.12em] uppercase">
        Offline
      </p>
      <h1 className="font-display text-ink mt-2 mb-4 text-[clamp(2.6rem,11vw,4rem)] leading-[0.95] font-bold tracking-[0.015em] uppercase">
        Saved pages
      </h1>
      <SavedPagesList />
    </section>
  )
}
