import type { Dependencies } from '@/shared/helpers/offline/savedPages'

/**
 * Keeping pages for offline use needs the browser's Cache API and a service
 * worker to serve what is kept. Without them (an old browser, some private
 * modes) the feature is simply not offered.
 */
export function supportsSavingPages(): boolean {
  return (
    typeof window !== 'undefined' &&
    'caches' in window &&
    'serviceWorker' in navigator
  )
}

/** What saving, refreshing and tidying use, taken from the running browser. */
export function browserDependencies(): Dependencies {
  return {
    fetch: window.fetch.bind(window),
    caches: window.caches,
    now: () => Date.now(),
  }
}
