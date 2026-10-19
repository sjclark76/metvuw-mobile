import { createStore } from 'jotai'

import { savedPagesAtom } from '@/components/Atoms/GlobalState'
import {
  collectGarbage,
  Dependencies,
  expiredPages,
  refreshPage,
  sanitizeSavedPages,
  SavedPage,
} from '@/shared/helpers/offline/savedPages'

type Store = ReturnType<typeof createStore>

const current = (store: Store) => sanitizeSavedPages(store.get(savedPagesAtom))

/**
 * Keeps the saved pages current once there is a connection: each is replaced by
 * its newest charts (a page whose charts have not changed costs one small
 * request), and any that could not be refreshed and have now gone a week without
 * being confirmed are dropped. Refreshing comes first, so a page left offline
 * for a fortnight is brought up to date rather than deleted.
 *
 * A page that cannot be refreshed keeps what it has; one failure never stops
 * the rest. Each result is merged into whatever is saved now, so a page the
 * visitor removed meanwhile does not come back.
 */
export async function syncSavedPages(
  store: Store,
  deps: Dependencies,
): Promise<void> {
  const pages = current(store)
  if (pages.length === 0) return

  for (const page of pages) {
    try {
      const fresh = await refreshPage(page, deps)
      store.set(
        savedPagesAtom,
        current(store).map((saved: SavedPage) =>
          saved.path === fresh.path ? fresh : saved,
        ),
      )
    } catch {
      // Offline again, or nothing published: it keeps what it has.
    }
  }

  const stale = expiredPages(current(store), deps.now())
  if (stale.length > 0) {
    const paths = new Set(stale.map((page) => page.path))
    store.set(
      savedPagesAtom,
      current(store).filter((page) => !paths.has(page.path)),
    )
  }

  await collectGarbage(current(store), deps)
}
