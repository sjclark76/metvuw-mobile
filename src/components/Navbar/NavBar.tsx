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
const radarLinks: MenuLink[] = Object.keys(radarRegions).map((key) => ({
  href: `/radar/${key}`,
  key,
  value: radarRegions[key],
}))
const balloonLinks: MenuLink[] = Object.keys(balloonLocations).map((key) => ({
  href: `/upperair/${key}`,
  key,
  value: balloonLocations[key],
}))

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useAtom(isMenuOpenAtom)
  const navRef = useRef<HTMLElement>(null) // Create a ref for the nav element

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
    'inline-flex items-center justify-center h-10 gap-2 px-5 font-bold tracking-wide text-white transition duration-300 rounded focus-visible:outline-none whitespace-nowrap hover:bg-slate-600 focus:bg-slate-700'

  return (
    <nav
      ref={navRef} // Attach the ref to the nav element
      className="flex flex-wrap items-center bg-linear-to-b from-slate-400 to-slate-500 p-2"
    >
      <Link href="/" className="mr-4 inline-flex items-center p-2">
        <MetvuwMobileImage />
        <span className="pl-2 text-xl font-bold tracking-wide text-white uppercase">
          Metvuw Mobile
        </span>
      </Link>
      <button
        aria-label="Open Menu"
        className="ml-auto inline-flex rounded-xs p-3 text-white outline-hidden hover:bg-slate-500 hover:text-white 2xl:hidden"
        onClick={handleClick}
      >
        <HamburgerSvg />
      </button>
      <div
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
              className="mr-1"
              onClick={() => setMenuOpen(false)}
            >
              Satellite
            </Link>
          </div>
          <DropDown heading="Radar" links={radarLinks} />
          <DropDown heading="Upper Air" links={balloonLinks} />
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
