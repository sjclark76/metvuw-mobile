import type { Metadata } from 'next'

import { SettingsPage } from '@/components/Settings/SettingsPage'

export const metadata: Metadata = {
  title: 'metvuw mobile | Settings',
  // Nothing here is public: it is the choices this device has made.
  robots: { index: false },
}

export default function Settings() {
  return (
    <section className="mx-auto max-w-176 px-4 py-8 md:px-0">
      <p className="text-ink-soft font-mono text-xs tracking-[0.12em] uppercase">
        This device
      </p>
      <h1 className="font-display text-ink mt-2 mb-6 text-[clamp(2.6rem,11vw,4rem)] leading-[0.95] font-bold tracking-[0.015em] uppercase">
        Settings
      </h1>
      <SettingsPage />
    </section>
  )
}
