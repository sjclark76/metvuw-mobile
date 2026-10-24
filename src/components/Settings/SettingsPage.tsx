'use client'
import { useAtom } from 'jotai'

import {
  showHeavyRainAtom,
  showSliderAtom,
  showViewerAtom,
} from '@/components/Atoms/GlobalState'
import { useIsMounted } from '@/components/Hooks/useIsMounted'
import { track } from '@/shared/helpers/analytics/track'

import { DataSettings } from './DataSettings'
import { HomePageSetting } from './HomePageSetting'
import { ThemeSetting } from './ThemeSetting'
import { ToggleRow } from './ToggleRow'

const Heading = ({ children }: { children: string }) => (
  <h2 className="font-display text-ink mt-8 mb-1 text-2xl font-bold tracking-[0.04em] uppercase first:mt-0">
    {children}
  </h2>
)

/**
 * The app's settings: where it opens, how it looks, what is in the footer, and the
 * data it keeps. Every choice is saved on this device and takes effect at once.
 * What is saved is only known in the browser, so the choices are not drawn before
 * the page is running there.
 */
export function SettingsPage() {
  const isMounted = useIsMounted()
  const [showViewer, setShowViewer] = useAtom(showViewerAtom)
  const [showSlider, setShowSlider] = useAtom(showSliderAtom)
  const [showHeavyRain, setShowHeavyRain] = useAtom(showHeavyRainAtom)

  if (!isMounted) return null

  return (
    <div className="divide-rule divide-y">
      <section aria-labelledby="settings-start">
        <div id="settings-start">
          <Heading>Start and look</Heading>
        </div>
        <HomePageSetting />
        <ThemeSetting />
      </section>
      <section aria-labelledby="settings-footer" className="pt-2">
        <div id="settings-footer">
          <Heading>The footer</Heading>
        </div>
        <ToggleRow
          label="Show the animated viewer"
          description="The button that plays the charts as a loop."
          checked={showViewer}
          onChange={(checked) => {
            track('setting_changed', { setting: 'viewer', value: checked })
            setShowViewer(checked)
          }}
        />
        <ToggleRow
          label="Show the time slider"
          description="Hiding the slider also hides the rain strip for your pins. You can still scroll down the page to move through the times."
          checked={showSlider}
          onChange={(checked) => {
            track('setting_changed', { setting: 'slider', value: checked })
            setShowSlider(checked)
          }}
        />
        {!showViewer && !showSlider && (
          <p className="text-ink-soft pb-4 text-sm">
            With both turned off the footer is not shown at all.
          </p>
        )}
      </section>
      <section aria-labelledby="settings-warnings" className="pt-2">
        <div id="settings-warnings">
          <Heading>Warnings</Heading>
        </div>
        <ToggleRow
          label="Show heavy rain warnings"
          description="A note at the top of a chart page when the charts show heavy rain ahead at a place you have pinned."
          checked={showHeavyRain}
          onChange={(checked) => {
            track('setting_changed', {
              setting: 'heavy_rain',
              value: checked,
            })
            setShowHeavyRain(checked)
          }}
        />
      </section>
      <section aria-labelledby="settings-data" className="pt-2">
        <div id="settings-data">
          <Heading>Data on this device</Heading>
        </div>
        <DataSettings />
      </section>
    </div>
  )
}
