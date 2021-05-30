import { DropDownLink } from './DropDown'

interface DropDownItemProps {
  region: DropDownLink
}

export const DropDownItem = (props: DropDownItemProps) => {
  return (
    <>
      <li className="hover:bg-purple-400 rounded">
        <a
          className="max-w-full py-2 px-4 block whitespace-no-wrap "
          href={`/regions/${props.region.code}`}
        >
          {props.region.name}
        </a>
      </li>
    </>
  )
}
