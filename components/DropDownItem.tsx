interface DropDownItemProps {
  name: string;
}

export const DropDownItem = (props: DropDownItemProps) => {
  return (
    <>
      <li className="">
        <a className="max-w-full py-2 px-4 block whitespace-no-wrap " href="#">
          {props.name}
        </a>
      </li>
    </>
  );
};
