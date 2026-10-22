'use client'
import { useAtom } from 'jotai'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

import { usePinCount } from '../Pins/usePins'
import { SavedMark } from '../SavedPages/SavedMark'
import { useSavedPageCount, useSavedPaths } from '../SavedPages/useSavedPaths'
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
  const pathname = usePathname()
  const savedPaths = useSavedPaths()
  const savedCount = useSavedPageCount()
  const pinCount = usePinCount()

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

  // In the side menu a link is a full-width row, left-aligned, with an orange edge
  // when it is the page you are on; in the bar it is as wide as its words.
  const headerText =
    'inline-flex items-center justify-center h-10 gap-2 px-5 font-bold tracking-wide text-bar-ink transition duration-300 rounded focus-visible:outline-none whitespace-nowrap hover:bg-white/10 focus:bg-white/15 lg:flex lg:w-full lg:justify-start lg:pr-3 lg:pl-[9px] lg:border-l-[3px] lg:border-transparent lg:has-[[aria-current=page]]:border-[#ff6a00] lg:has-[[aria-current=page]]:bg-white/15'
  // The menu's sections, named, on a wide screen only: the phone menu is already as
  // tall as the screen allows.
  const sectionTitle =
    'hidden lg:flex items-center gap-2 px-3 pt-4 pb-1 font-display text-[0.95rem] font-bold tracking-[0.1em] text-bar-ink/70 uppercase first:pt-1'
  const current = (href: string) => (pathname === href ? 'page' : undefined)

  return (
    <nav
      ref={navRef} // Attach the ref to the nav element
      className="text-bar-ink mx-auto flex max-w-176 flex-wrap items-center p-2 pl-4 lg:min-h-16 lg:max-w-none"
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
          className="text-bar-ink focus-visible:outline-bar-ink inline-flex rounded-xs p-3 outline-hidden hover:bg-white/10 focus-visible:outline-2 lg:hidden"
          onClick={handleClick}
        >
          <HamburgerSvg />
        </button>
      </div>
      <div
        id="site-menu"
        className={`${
          menuOpen ? '' : 'hidden'
        } lg:bg-bar w-full lg:fixed lg:top-16 lg:bottom-0 lg:left-0 lg:block lg:w-64 lg:overflow-y-auto lg:border-r lg:border-white/10 lg:p-2 print:hidden`}
      >
        <div className="flex w-full flex-col items-start lg:items-stretch">
          <h2 className={sectionTitle}>Forecast charts</h2>
          <DropDown heading="New Zealand" links={nzLinks} />
          <DropDown heading="Australia" links={australiaLinks} />
          <DropDown heading="Pacific" links={pacificLinks} />
          <DropDown heading="Europe" links={europeLinks} />
          <DropDown heading="Rest Of World" links={worldLinks} />
          <DropDown heading="Oceans" links={oceanLinks} />
          <h2 className={sectionTitle}>Observations</h2>
          <div className={headerText}>
            <Link
              href="/satellite"
              aria-current={current('/satellite')}
              className="mr-1 inline-flex items-center gap-2"
              onClick={() => setMenuOpen(false)}
            >
              Satellite
              <SavedMark saved={savedPaths.has('/satellite')} />
            </Link>
          </div>
          <DropDown heading="Radar" links={radarLinks} />
          <DropDown heading="Upper Air" links={balloonLinks} />
          <h2 className={sectionTitle}>Yours</h2>
          <div className={headerText}>
            <Link
              href="/saved"
              aria-current={current('/saved')}
              className="mr-1"
              prefetch={false}
              onClick={() => setMenuOpen(false)}
            >
              Saved{' '}
              {/* The count's room is held, so the menu does not shift once it is
                  known: what is saved is only known in the browser. */}
              <span className="inline-block min-w-[3ch]">
                {savedCount > 0 && `(${savedCount})`}
              </span>
            </Link>
          </div>
          <div className={headerText}>
            <Link
              href="/pins"
              aria-current={current('/pins')}
              className="mr-1"
              prefetch={false}
              onClick={() => setMenuOpen(false)}
            >
              Pins{' '}
              {/* Room for the count is held, as for Saved: what is pinned is only
                  known in the browser. */}
              <span className="inline-block min-w-[3ch]">
                {pinCount > 0 && `(${pinCount})`}
              </span>
            </Link>
          </div>
          <div className={headerText}>
            <Link
              href="/settings"
              aria-current={current('/settings')}
              className="mr-1"
              prefetch={false}
              onClick={() => setMenuOpen(false)}
            >
              Settings
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
