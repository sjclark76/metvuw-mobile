import { ChartResponse } from "../pages/api/charts";
import Image from "next/image";

interface DisplayChartsProps {
  charts: ChartResponse[];
}

export const DisplayCharts = (props: DisplayChartsProps) => {
  return (
    <>
      {props.charts.map((value, index) => (
        <Image
          key={index}
          src={value.url}
          alt="Picture of the author"
          layout="responsive"
          width={500}
          height={500}
        />
      ))}
    </>
  );
};
