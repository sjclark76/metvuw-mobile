'use client'
import { useAtom } from 'jotai'
import Link from 'next/link'
import { useEffect, useRef } from 'react' // Import useEffect and useRef

import { isMenuOpenAtom } from '@/components/Atoms/GlobalState'
import { HamburgerSvg } from '@/components/Navbar/components/HamburgerSvg'
import { MetvuwMobileImage } from '@/components/Navbar/components/MetvuwMobileImage'
import { balloonLocations } from '@/shared/types/balloonLocations'
import { radarRegions } from '@/shared/types/radarRegions'
import {
  australiaRegions,
  europeRegions,
  nzRegions,
  oceans,
  pacificRegions,
  Region,
  worldRegions,
} from '@/shared/types/region'

import { SavedMark } from '../SavedPages/SavedMark'
import { useSavedPaths } from '../SavedPages/useSavedPaths'
import SetHomePageIcon from '../SetHomePageIcon/SetHomePageIcon'
import { ThemeMenu } from '../ThemeToggle'
import DropDown from './components/DropDown'
import { MenuLink } from './types'

export const mapRegionToMenuLink = (regions: Region[]): MenuLink[] =>
  regions.map((region) => ({
    key: region.code,
    value: region.name,
    href: `/regions/${region.code}`,
  }))

const nzLinks = mapRegionToMenuLink(nzRegions)
const australiaLinks = mapRegionToMenuLink(australiaRegions)
const pacificLinks = mapRegionToMenuLink(pacificRegions)
const europeLinks = mapRegionToMenuLink(europeRegions)
const worldLinks = mapRegionToMenuLink(worldRegions)
const oceanLinks = mapRegionToMenuLink(oceans)
const radarLinks: MenuLink[] = Object.entries(radarRegions).map(
  ([key, value]) => ({
    href: `/radar/${key}`,
    key,
    value,
  }),
)
const balloonLinks: MenuLink[] = Object.entries(balloonLocations).map(
  ([key, value]) => ({
    href: `/upperair/${key}`,
    key,
    value,
  }),
)

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useAtom(isMenuOpenAtom)
  const navRef = useRef<HTMLElement>(null) // Create a ref for the nav element
  const savedPaths = useSavedPaths()

  const handleClick = () => {
    setMenuOpen((prev) => !prev)
  }

  // Effect to handle clicks outside the navbar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuOpen &&
        navRef.current &&
        !navRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false)
      }
    }

    // Add event listener when the menu is open
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    // Cleanup function to remove event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen, setMenuOpen]) // Re-run effect if menuOpen or setMenuOpen changes

  const headerText =
    'inline-flex items-center justify-center h-10 gap-2 px-5 font-bold tracking-wide text-bar-ink transition duration-300 rounded focus-visible:outline-none whitespace-nowrap hover:bg-white/10 focus:bg-white/15'

  return (
    <nav
      ref={navRef} // Attach the ref to the nav element
      className="text-bar-ink mx-auto flex max-w-176 flex-wrap items-center p-2 pl-4 2xl:max-w-none"
    >
      <Link
        href="/"
        aria-label="MetVuw Mobile home"
        className="@container mr-4 inline-flex min-h-11 min-w-0 flex-1 basis-0 items-center gap-2"
      >
        <MetvuwMobileImage />
        {/* Sized in rem, like the space it is given, so at larger text sizes it
            shows only as much of the name as fits whole, never half a word. */}
        <span className="font-display hidden text-[1.55rem] leading-none font-bold tracking-[0.06em] whitespace-nowrap uppercase @min-[8rem]:inline">
          metvuw{' '}
          <span className="ml-1 hidden text-[1.05rem] font-semibold tracking-[0.14em] opacity-70 @min-[12rem]:inline">
            mobile
          </span>
        </span>
      </Link>
      <div className="ml-auto flex shrink-0 items-center">
        <ThemeMenu />
        <SetHomePageIcon />
        <button
          aria-label="Menu"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          className="text-bar-ink focus-visible:outline-bar-ink inline-flex rounded-xs p-3 outline-hidden hover:bg-white/10 focus-visible:outline-2 2xl:hidden"
          onClick={handleClick}
        >
          <HamburgerSvg />
        </button>
      </div>
      <div
        id="site-menu"
        className={`${
          menuOpen ? '' : 'hidden'
        } w-full 2xl:inline-flex 2xl:w-auto 2xl:grow`}
      >
        <div className="flex w-full flex-col items-start 2xl:ml-auto 2xl:inline-flex 2xl:h-auto 2xl:w-auto 2xl:flex-row 2xl:items-center">
          <DropDown heading="New Zealand" links={nzLinks} />
          <DropDown heading="Australia" links={australiaLinks} />
          <DropDown heading="Pacific" links={pacificLinks} />
          <DropDown heading="Europe" links={europeLinks} />
          <DropDown heading="Rest Of World" links={worldLinks} />
          <DropDown heading="Oceans" links={oceanLinks} />
          <div className={headerText}>
            <Link
              href="/satellite"
              className="mr-1 inline-flex items-center gap-2"
              onClick={() => setMenuOpen(false)}
            >
              Satellite
              <SavedMark saved={savedPaths.has('/satellite')} />
            </Link>
          </div>
          <DropDown heading="Radar" links={radarLinks} />
          <DropDown heading="Upper Air" links={balloonLinks} />
          <div className={headerText}>
            <Link
              href="/saved"
              className="mr-1"
              prefetch={false}
              onClick={() => setMenuOpen(false)}
            >
              Saved{' '}
              {/* The count's room is held, so the menu does not shift once it is
                  known: what is saved is only known in the browser. */}
              <span className="inline-block min-w-[3ch]">
                {savedPaths.size > 0 && `(${savedPaths.size})`}
              </span>
            </Link>
          </div>
          <div className={headerText}>
            <a className="mr-1" href="mailto:metvuwmobile@gmail.com">
              Contact
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
