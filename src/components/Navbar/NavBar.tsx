'use client'
import { balloonLocations } from '@shared/balloonLocations'
import { radarRegions } from '@shared/radarRegions'
import {
  australiaRegions,
  europeRegions,
  nzRegions,
  oceans,
  pacificRegions,
  Region,
  worldRegions,
} from '@shared/region'
import Link from 'next/link'
import { useState } from 'react'

import { MetvuwMobileImage } from '@/components/Navbar/components/MetvuwMobileImage'

import DropDown from './components/DropDown'
import styles from './NavBar.module.css'
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
  key,
  value: radarRegions[key],
  href: `/radar/${key}`,
}))
const balloonLinks: MenuLink[] = Object.keys(balloonLocations).map((key) => ({
  key,
  value: balloonLocations[key],
  href: `/upperair/${key}`,
}))

const Navbar = () => {
  const [active, setActive] = useState(false)
  const handleClick = () => {
    setActive(!active)
  }

  return (
    <nav className="flex flex-wrap items-center bg-gradient-to-r from-blue-300  to-blue-600 p-2 ">
      <Link href="/" className="mr-4 inline-flex items-center p-2 ">
        <MetvuwMobileImage />
        <span className="pl-2 text-xl font-bold uppercase tracking-wide text-white ">
          Metvuw Mobile
        </span>
      </Link>
      <button
        aria-label="Open Menu"
        className="ml-auto inline-flex rounded p-3 text-white outline-none hover:bg-blue-600 hover:text-white 2xl:hidden"
        onClick={handleClick}
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      <div
        className={`${
          active ? '' : 'hidden'
        }   w-full 2xl:inline-flex 2xl:w-auto 2xl:flex-grow`}
      >
        <div className="flex w-full flex-col items-start 2xl:ml-auto 2xl:inline-flex 2xl:h-auto  2xl:w-auto 2xl:flex-row 2xl:items-center">
          <DropDown heading="New Zealand" links={nzLinks} />
          <DropDown heading="Australia" links={australiaLinks} />
          <DropDown heading="Pacific" links={pacificLinks} />
          <DropDown heading="Europe" links={europeLinks} />
          <DropDown heading="Rest Of World" links={worldLinks} />
          <DropDown heading="Oceans" links={oceanLinks} />
          <div className={styles.headerText}>
            <Link href="/satellite" className="mr-1">
              Satellite
            </Link>
          </div>
          <DropDown heading="Radar" links={radarLinks} />
          <DropDown heading="Upper Air" links={balloonLinks} />
          <div className={styles.headerText}>
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
