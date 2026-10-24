'use client'
import { useAtomValue } from 'jotai'
import { useEffect } from 'react'

import {
  showHeavyRainAtom,
  showSliderAtom,
  showViewerAtom,
} from '@/components/Atoms/GlobalState'
import { usePins } from '@/components/Pins/usePins'

/**
 * Keeps the page's `data-hide-viewer` and `data-hide-slider` in step with the
 * Settings as they are changed. The script in the head puts them there when a page
 * is loaded (see `layoutScript`), before the first paint; this does the same when a
 * switch is turned on or off while the app is open, in this tab or another, so a
 * change takes effect at once and not only after a reload. Renders nothing.
 */
export function ApplyLayoutSettings() {
  const showViewer = useAtomValue(showViewerAtom)
  const showSlider = useAtomValue(showSliderAtom)
  const showHeavyRain = useAtomValue(showHeavyRainAtom)
  const hasPins = usePins().pins.length > 0

  useEffect(() => {
    const root = document.documentElement
    const set = (name: string, hidden: boolean) =>
      hidden ? root.setAttribute(name, '') : root.removeAttribute(name)
    set('data-hide-viewer', !showViewer)
    set('data-hide-slider', !showSlider)
    set('data-hide-heavy-rain', !showHeavyRain)
    set('data-has-pins', hasPins)
  }, [showViewer, showSlider, showHeavyRain, hasPins])

  return null
}
