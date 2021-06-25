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
              xmlns="http://www.w3.org/2000/svg"
              width="24pt"
              height="24pt"
              viewBox="0 0 24 24"
              version="1.1"
            >
              <g id="surface1">
                <path
                  stroke="none"
                  fill-rule="nonzero"
                  fill="rgb(100%,98.823529%,98.823529%)"
                  fill-opacity="1"
                  d="M 20.570312 6 C 18.679688 6 17.144531 7.539062 17.144531 9.429688 C 17.144531 9.902344 17.527344 10.285156 18 10.285156 C 18.472656 10.285156 18.855469 9.902344 18.855469 9.429688 C 18.855469 8.484375 19.625 7.714844 20.570312 7.714844 C 21.515625 7.714844 22.285156 8.484375 22.285156 9.429688 C 22.285156 10.375 21.515625 11.144531 20.570312 11.144531 L 0.925781 11.144531 C 0.453125 11.144531 0.0664062 11.527344 0.0664062 12 C 0.0664062 12.472656 0.453125 12.855469 0.925781 12.855469 L 20.570312 12.855469 C 22.460938 12.855469 24 11.320312 24 9.429688 C 24 7.539062 22.460938 6 20.570312 6 Z M 20.570312 6 "
                />
                <path
                  stroke="none"
                  fill-rule="nonzero"
                  fill="rgb(100%,98.823529%,98.823529%)"
                  fill-opacity="1"
                  d="M 12 2.570312 C 10.109375 2.570312 8.570312 4.109375 8.570312 6 C 8.570312 6.472656 8.953125 6.855469 9.429688 6.855469 C 9.902344 6.855469 10.285156 6.472656 10.285156 6 C 10.285156 5.054688 11.054688 4.285156 12 4.285156 C 12.945312 4.285156 13.714844 5.054688 13.714844 6 C 13.714844 6.945312 12.945312 7.714844 12 7.714844 L 0.855469 7.714844 C 0.382812 7.714844 0 8.097656 0 8.570312 C 0 9.042969 0.382812 9.429688 0.855469 9.429688 L 12 9.429688 C 13.890625 9.429688 15.429688 7.890625 15.429688 6 C 15.429688 4.109375 13.890625 2.570312 12 2.570312 Z M 12 2.570312 "
                />
                <path
                  stroke="none"
                  fill-rule="nonzero"
                  fill="rgb(100%,98.823529%,98.823529%)"
                  fill-opacity="1"
                  d="M 12 14.570312 L 0.855469 14.570312 C 0.382812 14.570312 0 14.957031 0 15.429688 C 0 15.902344 0.382812 16.285156 0.855469 16.285156 L 12 16.285156 C 12.945312 16.285156 13.714844 17.054688 13.714844 18 C 13.714844 18.945312 12.945312 19.714844 12 19.714844 C 11.054688 19.714844 10.285156 18.945312 10.285156 18 C 10.285156 17.527344 9.902344 17.144531 9.429688 17.144531 C 8.953125 17.144531 8.570312 17.527344 8.570312 18 C 8.570312 19.890625 10.109375 21.429688 12 21.429688 C 13.890625 21.429688 15.429688 19.890625 15.429688 18 C 15.429688 16.109375 13.890625 14.570312 12 14.570312 Z M 12 14.570312 "
                />
              </g>
            </svg>

            {/*<svg*/}
            {/*  xmlns="http://www.w3.org/2000/svg"*/}
            {/*  id="body_1"*/}
            {/*  width="30"*/}
            {/*  height="30"*/}
            {/*>*/}
            {/*  <g transform="matrix(0.06696428 0 0 0.06696428 0 0)">*/}
            {/*    <g transform="matrix(1 0 0 1 0 0)"></g>*/}
            {/*    <path*/}
            {/*      transform="matrix(1 0 0 1 0 0)"*/}
            {/*      d="M-1 -1L581 -1L581 401L-1 401L-1 -1z"*/}
            {/*      stroke="none"*/}
            {/*      fill="none"*/}
            {/*    />*/}
            {/*    <g transform="matrix(1 0 0 1 0 0)"></g>*/}
            {/*    <path*/}
            {/*      transform="matrix(1 0 0 1 0 0)"*/}
            {/*      d="M384 112C 348.703 112 320 140.711 320 176C 320 184.836 327.156 192 336 192C 344.844 192 352 184.836 352 176C 352 158.351 366.359 144 384 144C 401.641 144 416 158.351 416 176C 416 193.649 401.641 208 384 208L384 208L17.265991 208C 8.421991 208 1.2659912 215.164 1.2659912 224C 1.2659912 232.836 8.421991 240 17.265991 240L17.265991 240L384 240C 419.297 240 448 211.289 448 176C 448 140.711 419.297 112 384 112z"*/}
            {/*      stroke="none"*/}
            {/*      fill="#FFFCFC"*/}
            {/*      fill-rule="nonzero"*/}
            {/*    />*/}
            {/*    <g transform="matrix(1 0 0 1 0 0)"></g>*/}
            {/*    <path*/}
            {/*      transform="matrix(1 0 0 1 0 0)"*/}
            {/*      d="M224 48C 188.703 48 160 76.711 160 112C 160 120.836 167.156 128 176 128C 184.844 128 192 120.836 192 112C 192 94.351 206.359 80 224 80C 241.641 80 256 94.351 256 112C 256 129.649 241.641 144 224 144L224 144L16 144C 7.156 144 0 151.164 0 160C 0 168.836 7.156 176 16 176L16 176L224 176C 259.297 176 288 147.289 288 112C 288 76.711 259.297 48 224 48z"*/}
            {/*      stroke="none"*/}
            {/*      fill="#FFFCFC"*/}
            {/*      fill-rule="nonzero"*/}
            {/*    />*/}
            {/*    <g transform="matrix(1 0 0 1 0 0)"></g>*/}
            {/*    <path*/}
            {/*      transform="matrix(1 0 0 1 0 0)"*/}
            {/*      d="M224 272L16 272C 7.156 272 0 279.164 0 288C 0 296.836 7.156 304 16 304L16 304L224 304C 241.641 304 256 318.351 256 336C 256 353.649 241.641 368 224 368C 206.359 368 192 353.649 192 336C 192 327.164 184.844 320 176 320C 167.156 320 160 327.164 160 336C 160 371.289 188.703 400 224 400C 259.297 400 288 371.289 288 336C 288 300.711 259.297 272 224 272z"*/}
            {/*      stroke="none"*/}
            {/*      fill="#FFFCFC"*/}
            {/*      fill-rule="nonzero"*/}
            {/*    />*/}
            {/*  </g>*/}
            {/*</svg>*/}
            <span className="pl-2 text-xl text-white font-bold uppercase tracking-wide ">
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
          <h1 className="text-base text-center font-medium text-sm text-gray-800 my-4 ">
            {submenuText}
          </h1>
        </div>
      </div>
    </div>
  )
}
