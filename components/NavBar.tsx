import Link from 'next/link'
import { useContext, useState } from 'react'
import { DropDown } from './DropDown'
import { Region } from '../shared/region'
import { GlobalContext } from './GlobalProvider'

const nzLinks: Region[] = [
  { name: 'New Zealand', code: 'nz' },
  { name: 'North Island', code: 'nzni' },
  { name: 'South Island', code: 'nzsi' },
]
const australiaLinks: Region[] = [
  { name: 'Victoria & Tasmania', code: 'victoria' },
  { name: 'New South Wales', code: 'nsw' },
  { name: 'Western Australia', code: 'waussie' },
  { name: 'Perth', code: 'swaussie' },
  { name: 'Queensland', code: 'queensland' },
  { name: 'South Australia', code: 'saussie' },
  { name: 'South East Australia', code: 'seaussie' },
]
const pacificLinks: Region[] = [
  { name: 'New Caledonia', code: 'newcaledonia' },
  { name: 'Fiji', code: 'fiji' },
  { name: 'South West Pacific', code: 'swp' },
  { name: 'Fiji - NZ', code: 'ocean' },
]
const europeLinks: Region[] = [
  { name: 'Europe', code: 'europe' },
  { name: 'United Kingdom', code: 'uk' },
  { name: 'Estonia', code: 'estonia' },
  { name: 'Turkey', code: 'turkey' },
]
const worldLinks: Region[] = [
  { name: 'World', code: 'world' },
  { name: 'South Atlantic', code: 'satlantic' },
  { name: 'North Atlantic', code: 'natlantic' },
  { name: 'USA', code: 'usa' },
  { name: 'Japan', code: 'japan' },
  { name: 'South Africa', code: 'safrica' },
]

export const Navbar = () => {
  const [active, setActive] = useState(false)
  const handleClick = () => {
    setActive(!active)
  }

  const { submenuText } = useContext(GlobalContext)
  return (
    <div className="sticky top-0 z-50">
      <nav className="flex items-center flex-wrap bg-gradient-to-r from-purple-400  to-blue-600 p-2 ">
        <Link href="/">
          <a className="inline-flex items-center p-2 mr-4 ">
            <svg
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              className="fill-current text-white h-8 w-8 mr-2"
            >
              <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z" />
            </svg>
            <span className="text-xl text-white font-bold uppercase tracking-wide">
              Metvuw Mobile
            </span>
          </a>
        </Link>
        <button
          className=" inline-flex p-3 hover:bg-blue-600 rounded lg:hidden text-white ml-auto hover:text-white outline-none"
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
            <div className="px-3 py-2 rounded-t text-white font-bold items-center justify-center hover:bg-blue-400 hover:text-white inline-flex">
              <a className="mr-1" href="mailto:metvuwmobile@gmail.com">
                Contact
              </a>
            </div>
          </div>
        </div>
      </nav>
      <div className="flex flex-row justify-center">
        <div className="px-2 filter  bg-gray-50 w-full ">
          <p className="text-base text-center  text-gray-800 my-4 ">
            {submenuText}
          </p>
        </div>
      </div>
    </div>
  )
}
