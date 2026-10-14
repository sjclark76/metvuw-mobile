'use client'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'

/**
 * Tracks how many of a page's images have loaded, for the progress bar in the
 * sub header. State belongs to the page (it lives in the provider), so it
 * starts from zero on every navigation, survives re-renders, and counts each
 * image once, however often it reports.
 */
interface ImageProgressStore {
  subscribe: (listener: () => void) => () => void
  getLoadedCount: () => number
  markLoaded: (src: string) => void
}

function createStore(): ImageProgressStore {
  const loaded = new Set<string>()
  const listeners = new Set<() => void>()
  let loadedCount = 0

  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getLoadedCount: () => loadedCount,
    markLoaded(src) {
      if (loaded.has(src)) return
      loaded.add(src)
      loadedCount = loaded.size
      listeners.forEach((listener) => listener())
    },
  }
}

const ImageProgressContext = createContext<{
  store: ImageProgressStore
  expected: number
} | null>(null)

const noopSubscribe = () => () => {}
const zero = () => 0
const noop = () => {}

export function ImageProgressProvider({
  expected,
  children,
}: {
  /** How many images should have loaded for the page to count as loaded. */
  expected: number
  children: ReactNode
}) {
  const [store] = useState(createStore)
  const value = useMemo(() => ({ store, expected }), [store, expected])

  return <ImageProgressContext value={value}>{children}</ImageProgressContext>
}

/** Percentage (0 to 100) of the expected images that have loaded. */
export function useImageProgress(): number {
  const context = useContext(ImageProgressContext)
  const loadedCount = useSyncExternalStore(
    context?.store.subscribe ?? noopSubscribe,
    context?.store.getLoadedCount ?? zero,
    zero,
  )

  if (!context || context.expected <= 0) return 0
  return Math.min(100, (loadedCount / context.expected) * 100)
}

/** Reports an image as loaded. Does nothing outside an ImageProgressProvider. */
export function useMarkImageLoaded(): (src: string) => void {
  const context = useContext(ImageProgressContext)
  const markLoaded = context?.store.markLoaded

  return useCallback(
    (src: string) => (markLoaded ? markLoaded(src) : noop()),
    [markLoaded],
  )
}
