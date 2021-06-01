import Link from 'next/link'
import { useState } from 'react'
import { DropDown, DropDownLink } from './DropDown'

const nzLinks: DropDownLink[] = [
  { name: 'All', code: 'nz' },
  { name: 'North Island', code: 'nzni' },
  { name: 'South Island', code: 'nzsi' },
]
const australiaLinks: DropDownLink[] = [
  { name: 'Victoria & Tasmania', code: 'victoria' },
  { name: 'New South Wales', code: 'nsw' },
  { name: 'Western Australia', code: 'waussie' },
  { name: 'Perth', code: 'swaussie' },
  { name: 'Queensland', code: 'queensland' },
  { name: 'South Australia', code: 'saussie' },
  { name: 'South East Australia', code: 'seaussie' },
]
const pacificLinks: DropDownLink[] = [
  { name: 'New Caledonia', code: 'newcaledonia' },
  { name: 'Fiji', code: 'fiji' },
  { name: 'South West Pacific', code: 'swp' },
  { name: 'Fiji - NZ', code: 'ocean' },
]
const europeLinks: DropDownLink[] = [
  { name: 'Europe', code: 'europe' },
  { name: 'United Kingdom', code: 'uk' },
  { name: 'Estonia', code: 'estonia' },
  { name: 'Turkey', code: 'turkey' },
]
const worldLinks: DropDownLink[] = [
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
  return (
    <>
      <nav className="flex items-center flex-wrap bg-gradient-to-r from-purple-400  to-blue-500 p-3 ">
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
          className=" inline-flex p-3 hover:bg-purple-600 rounded lg:hidden text-white ml-auto hover:text-white outline-none"
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
            <DropDown heading="Contact" links={nzLinks} />
          </div>
        </div>
      </nav>
    </>
  )
}
