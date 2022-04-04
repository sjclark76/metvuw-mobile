import { Region } from '../../shared/region'

interface DropDownItemProps {
  region: Region
}

export const DropDownItem = (props: DropDownItemProps) => {
  return (
    <>
      <li key={props.region.code} className="hover:bg-blue-500 rounded">
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
