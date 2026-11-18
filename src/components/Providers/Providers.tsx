'use client'

import { Provider } from 'jotai'
import { ReactNode } from 'react'

/**
 * The client-side providers for every page, kept out of the root layout so the
 * layout itself stays a server component.
 */
export function Providers({ children }: { children: ReactNode }) {
  return <Provider>{children}</Provider>
}
