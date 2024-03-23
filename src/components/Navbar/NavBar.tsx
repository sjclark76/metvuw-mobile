'use client'
import Link from 'next/link'
import { useState } from 'react'
import DropDown from './components/DropDown'
import {
  australiaRegions,
  europeRegions,
  nzRegions,
  oceans,
  pacificRegions,
  Region,
  worldRegions,
} from '@shared/region'
import { MenuLink } from './types'
import { radarRegions } from '@shared/radarRegions'
import styles from './NavBar.module.css'
import { balloonLocations } from '@shared/balloonLocations'
import { MetvuwMobileImage } from '@/components/Navbar/components/MetvuwMobileImage'

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
    <nav className="flex items-center flex-wrap bg-gradient-to-r from-blue-300  to-blue-600 p-2 ">
      <Link href="/" className="inline-flex items-center p-2 mr-4 ">
        <MetvuwMobileImage />
        <span className="pl-2 text-xl text-white font-bold uppercase tracking-wide ">
          Metvuw Mobile
        </span>
      </Link>
      <button
        aria-label="Open Menu"
        className="xl:hidden inline-flex p-3 hover:bg-blue-600 rounded text-white ml-auto hover:text-white outline-none"
        onClick={handleClick}
      >
        <svg
          className="w-6 h-6"
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
        }   w-full xl:inline-flex xl:flex-grow xl:w-auto`}
      >
        <div className="xl:inline-flex xl:flex-row xl:ml-auto xl:w-auto w-full xl:items-center items-start  flex flex-col xl:h-auto">
          <DropDown heading="New Zealand" links={nzLinks} />
          <DropDown heading="Australia" links={australiaLinks} />
          <DropDown heading="Pacific" links={pacificLinks} />
          <DropDown heading="Europe" links={europeLinks} />
          <DropDown heading="Rest Of World" links={worldLinks} />
          <DropDown heading="Oceans" links={oceanLinks} />
          <div className={styles.headerText}>
            <Link href="/legacy/satellite" className="mr-1">
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
