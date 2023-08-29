import Link from 'next/link'
import { useState } from 'react'
import DropDown from './components/DropDown'
import {
  australiaRegions,
  europeRegions,
  nzRegions,
  pacificRegions,
  Region,
  worldRegions,
} from '../../shared/region'
import { MenuLink } from './types'
import { radarRegions } from '../../shared/radarRegions'
import styles from './NavBar.module.css'
import { useAtomValue } from 'jotai'
import { submenuTextAtom } from '../Atoms/GlobalState'

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
const radarLinks: MenuLink[] = Object.keys(radarRegions).map((key) => ({
  key,
  value: radarRegions[key],
  href: `/radar/${key}`,
}))

const Navbar = () => {
  const [active, setActive] = useState(false)
  const handleClick = () => {
    setActive(!active)
  }
  const submenuText = useAtomValue(submenuTextAtom)

  return (
    <div className="sticky top-0 z-50">
      <nav className="flex items-center flex-wrap bg-gradient-to-r from-purple-400  to-blue-600 p-2 ">
        <Link href="/" className="inline-flex items-center p-2 mr-4 ">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24pt"
            height="24pt"
            viewBox="0 0 24 24"
            version="1.1"
          >
            <g id="surface1">
              <path
                stroke="none"
                fillRule="nonzero"
                fill="rgb(100%,98.823529%,98.823529%)"
                fillOpacity="1"
                d="M 20.570312 6 C 18.679688 6 17.144531 7.539062 17.144531 9.429688 C 17.144531 9.902344 17.527344 10.285156 18 10.285156 C 18.472656 10.285156 18.855469 9.902344 18.855469 9.429688 C 18.855469 8.484375 19.625 7.714844 20.570312 7.714844 C 21.515625 7.714844 22.285156 8.484375 22.285156 9.429688 C 22.285156 10.375 21.515625 11.144531 20.570312 11.144531 L 0.925781 11.144531 C 0.453125 11.144531 0.0664062 11.527344 0.0664062 12 C 0.0664062 12.472656 0.453125 12.855469 0.925781 12.855469 L 20.570312 12.855469 C 22.460938 12.855469 24 11.320312 24 9.429688 C 24 7.539062 22.460938 6 20.570312 6 Z M 20.570312 6 "
              />
              <path
                stroke="none"
                fillRule="nonzero"
                fill="rgb(100%,98.823529%,98.823529%)"
                fillOpacity="1"
                d="M 12 2.570312 C 10.109375 2.570312 8.570312 4.109375 8.570312 6 C 8.570312 6.472656 8.953125 6.855469 9.429688 6.855469 C 9.902344 6.855469 10.285156 6.472656 10.285156 6 C 10.285156 5.054688 11.054688 4.285156 12 4.285156 C 12.945312 4.285156 13.714844 5.054688 13.714844 6 C 13.714844 6.945312 12.945312 7.714844 12 7.714844 L 0.855469 7.714844 C 0.382812 7.714844 0 8.097656 0 8.570312 C 0 9.042969 0.382812 9.429688 0.855469 9.429688 L 12 9.429688 C 13.890625 9.429688 15.429688 7.890625 15.429688 6 C 15.429688 4.109375 13.890625 2.570312 12 2.570312 Z M 12 2.570312 "
              />
              <path
                stroke="none"
                fillRule="nonzero"
                fill="rgb(100%,98.823529%,98.823529%)"
                fillOpacity="1"
                d="M 12 14.570312 L 0.855469 14.570312 C 0.382812 14.570312 0 14.957031 0 15.429688 C 0 15.902344 0.382812 16.285156 0.855469 16.285156 L 12 16.285156 C 12.945312 16.285156 13.714844 17.054688 13.714844 18 C 13.714844 18.945312 12.945312 19.714844 12 19.714844 C 11.054688 19.714844 10.285156 18.945312 10.285156 18 C 10.285156 17.527344 9.902344 17.144531 9.429688 17.144531 C 8.953125 17.144531 8.570312 17.527344 8.570312 18 C 8.570312 19.890625 10.109375 21.429688 12 21.429688 C 13.890625 21.429688 15.429688 19.890625 15.429688 18 C 15.429688 16.109375 13.890625 14.570312 12 14.570312 Z M 12 14.570312 "
              />
            </g>
          </svg>

          <span className="pl-2 text-xl text-white font-bold uppercase tracking-wide ">
            Metvuw Mobile
          </span>
        </Link>
        <button
          aria-label="Open Menu"
          className="lg:hidden inline-flex p-3 hover:bg-blue-600 rounded text-white ml-auto hover:text-white outline-none"
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
          }   w-full lg:inline-flex lg:flex-grow lg:w-auto`}
        >
          <div className="lg:inline-flex lg:flex-row lg:ml-auto lg:w-auto w-full lg:items-center items-start  flex flex-col lg:h-auto">
            <DropDown heading="New Zealand" links={nzLinks} />
            <DropDown heading="Australia" links={australiaLinks} />
            <DropDown heading="Pacific" links={pacificLinks} />
            <DropDown heading="Europe" links={europeLinks} />
            <DropDown heading="Rest Of World" links={worldLinks} />
            <div className={styles.headerText}>
              <Link href="/satellite" className="mr-1">
                Satellite
              </Link>
            </div>
            <DropDown heading="Radar" links={radarLinks} />
            <div className={styles.headerText}>
              <a className="mr-1" href="mailto:metvuwmobile@gmail.com">
                Contact
              </a>
            </div>
          </div>
        </div>
      </nav>
      <div className="flex flex-row justify-center">
        <div className="px-2 filter  bg-gray-50 w-full ">
          <h1 className="text-center font-medium text-sm text-gray-800 my-4 ">
            {/*{submenuTextAtomnuText}*/}
          </h1>
        </div>
      </div>
    </div>
  )
}

export default Navbar
