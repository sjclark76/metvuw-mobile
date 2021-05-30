import { ChartResponse } from "../pages/api/charts/[region]";
import Image from "next/image";

interface DisplayChartsProps {
  charts: ChartResponse[];
}

export const DisplayCharts = (props: DisplayChartsProps) => {
  return (
    <div className="pt-2">
      {props.charts.map((chart, index) => (
        <div className="flex justify-center py-3 ">
          <Image
            key={index}
            src={chart.url}
            alt="Picture of the author"
            layout="intrinsic"
            width={711}
            height={600}
          />
        </div>
      ))}
      s
    </div>
  );
};
