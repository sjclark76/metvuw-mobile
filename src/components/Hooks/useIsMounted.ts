import { useSyncExternalStore } from 'react'

const noSubscription = () => () => {}
const mounted = () => true
const notYetMounted = () => false

/**
 * False while the page is rendered ahead of time and while it hydrates, true
 * once it is running in the browser. For anything that is only known there (a
 * saved choice, the connection): render the neutral version until this is true,
 * so what React hydrates matches what the host rendered.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(noSubscription, mounted, notYetMounted)
}
