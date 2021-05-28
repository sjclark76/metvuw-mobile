import { DropDownItem } from "./DropDownItem";

export interface DropDownLink {
  name: string;
}

interface DropDownProps {
  heading: string;
  links: DropDownLink[];
}

export const DropDown = (props: DropDownProps) => {
  return (
    <>
      <div className="group inline-block relative">
        <button className="px-3 py-2 rounded text-white font-bold items-center justify-center hover:bg-purple-600 hover:text-white inline-flex">
          <span className="mr-1">{props.heading}</span>
          <svg
            className="fill-current h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </button>
        <ul className="absolute hidden rounded text-white font-bold bg-purple-300 pt-1 group-hover:block">
          {props.links.map((link) => (
            <DropDownItem name={link.name} />
          ))}
        </ul>
      </div>
    </>
  );
};
