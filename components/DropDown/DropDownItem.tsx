import { Region } from '../../shared/region'

interface DropDownItemProps {
  key: string
  value: string
  href: string
}

export const DropDownItem = ({ key, value, href }: DropDownItemProps) => {
  return (
    <>
      <li key={key} className="hover:bg-blue-500 rounded">
        <a
          className="max-w-full py-2 px-4 block whitespace-no-wrap "
          href={href}
        >
          {value}
        </a>
      </li>
    </>
  )
}
