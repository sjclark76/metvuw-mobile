'use client'
import { useAtom } from 'jotai'
import { useId } from 'react'

import { favoritePageAtom } from '@/components/Atoms/GlobalState'

import { DEFAULT_HOME_LABEL, homePageGroups } from './homePageOptions'

const known = new Set(
  homePageGroups.flatMap((group) => group.options.map((o) => o.path)),
)

/**
 * The page the app opens on. It is the same saved choice as the "use this page as
 * my home page" button in the navigation, so the two always agree. A saved page
 * that is not one of those listed (the New Zealand forecast at its other address,
 * say) shows as the default.
 */
export function HomePageSetting() {
  const [favourite, setFavourite] = useAtom(favoritePageAtom)
  const id = useId()
  const value = favourite && known.has(favourite) ? favourite : ''

  return (
    <div className="py-4">
      <label htmlFor={id} className="text-ink block font-semibold">
        Home page
      </label>
      <p className="text-ink-soft mb-2 text-sm">The page the app opens on.</p>
      <select
        id={id}
        value={value}
        onChange={(event) => setFavourite(event.target.value || null)}
        className="border-rule bg-plate text-ink focus-visible:outline-cold min-h-11 w-full rounded border px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <option value="">{DEFAULT_HOME_LABEL}</option>
        {homePageGroups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((option) => (
              <option key={option.path} value={option.path}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
