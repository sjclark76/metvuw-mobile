'use client'
import { useAtomValue, useStore } from 'jotai'
import { useCallback, useMemo, useState } from 'react'

import { savedPagesAtom } from '@/components/Atoms/GlobalState'
import {
  collectGarbage,
  coversPath,
  downloadPage,
  sanitizeSavedPages,
  SavedPage,
} from '@/shared/helpers/offline/savedPages'

import { browserDependencies } from './browserDependencies'

/** The pages saved for offline use, and how to forget one. */
export function useSavedPageList() {
  const store = useStore()
  const stored = useAtomValue(savedPagesAtom)
  const pages = useMemo(() => sanitizeSavedPages(stored), [stored])

  const remove = useCallback(
    async (path: string) => {
      const current = sanitizeSavedPages(store.get(savedPagesAtom))
      store.set(
        savedPagesAtom,
        current.filter((page) => page.path !== path),
      )
      try {
        await collectGarbage(
          sanitizeSavedPages(store.get(savedPagesAtom)),
          browserDependencies(),
        )
      } catch {
        // Forgotten either way; what is left over is swept up next time.
      }
    },
    [store],
  )

  return { pages, remove }
}

export type SaveStatus = 'idle' | 'saving' | 'failed'

/** Saving one page for offline use, and forgetting it again. */
export function useSavedPage(path: string) {
  const store = useStore()
  const { pages, remove } = useSavedPageList()
  const [status, setStatus] = useState<SaveStatus>('idle')

  const saved: SavedPage | undefined = pages.find((page) =>
    coversPath(page, path),
  )

  const save = useCallback(async () => {
    setStatus('saving')
    try {
      const deps = browserDependencies()
      const page = await downloadPage(path, deps)
      // Merged into what is saved now, which may have changed while it downloaded.
      store.set(savedPagesAtom, [
        ...sanitizeSavedPages(store.get(savedPagesAtom)).filter(
          (other) => other.path !== page.path,
        ),
        page,
      ])
      setStatus('idle')
      await collectGarbage(
        sanitizeSavedPages(store.get(savedPagesAtom)),
        deps,
      ).catch(() => {})
    } catch {
      setStatus('failed')
    }
  }, [path, store])

  // Removed by the page's own path, which may differ from the address it was
  // reached at (the home page is the New Zealand region page).
  return { saved, status, save, remove: () => remove(saved?.path ?? path) }
}
