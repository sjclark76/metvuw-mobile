import { MenuLink } from '../types'
import { useEffect, useRef, useState } from 'react'
import styles from '../NavBar.module.css'
interface DropDownProps {
  heading: string
  links: MenuLink[]
}
const DropDown = (props: DropDownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<number | undefined>(undefined)
  const wrapperRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  })

  const handleKeyDown = (e) => {
    if (isOpen) {
      e.preventDefault()

      switch (e.keyCode) {
        // KeyDown
        case 40:
          if (currentItem === props.links.length - 1) {
            setCurrentItem(0)
          } else {
            const newValue = currentItem === undefined ? 0 : currentItem + 1
            setCurrentItem(newValue)
          }
          break
        // KeyUp
        case 38:
          if (currentItem === 0) {
            setCurrentItem(props.links.length - 1)
          } else {
            setCurrentItem(
              currentItem ? currentItem - 1 : props.links.length - 1,
            )
          }
          break
        // Escape
        case 27:
          setCurrentItem(1)
          setIsOpen(false)
          break
        default:
          break
      }
    }
  }
  return (
    <div className="relative inline-flex " id="dropdown">
      <button
        className={`${styles.headerText}`}
        onClick={() => setIsOpen((prevState) => !prevState)}
        aria-expanded={isOpen}
        ref={wrapperRef}
      >
        <span>{props.heading}</span>
        <span className="relative only:-mx-5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-labelledby="t-01 d-01"
            role="graphics-symbol"
          >
            <title id="t-01">Button icon</title>
            <desc id="d-01">An icon describing the buttons usage</desc>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </span>
      </button>
      <ul
        className={`${
          isOpen ? 'flex' : 'hidden'
        } absolute top-full z-10 mt-3 flex w-72 list-none flex-col rounded bg-white py-2 shadow-md shadow-slate-500/10 `}
      >
        {props.links.map((item, index) => {
          return (
            <li key={index}>
              <a
                className={` ${
                  index === currentItem
                    ? 'bg-emerald-50 text-blue-500'
                    : 'bg-none text-slate-500'
                } flex items-start justify-start gap-2 p-2 px-5 transition-colors duration-300 hover:bg-blue-50 hover:text-blue-500 focus:bg-blue-50 focus:text-blue-600 focus:outline-none focus-visible:outline-none`}
                href={item.href}
                aria-current={index + 1 === currentItem ? 'page' : 'false'}
              >
                <span className="flex flex-col gap-1 overflow-hidden whitespace-nowrap">
                  <span className="truncate leading-5">{item.value}</span>
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default DropDown
