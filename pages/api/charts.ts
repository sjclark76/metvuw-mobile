import { NextApiRequest, NextApiResponse } from "next";

export interface ChartResponse {
  url: string;
}

function foo() {}
export default (req: NextApiRequest, res: NextApiResponse) => {
  const charts: ChartResponse[] = [
    {
      url: "http://www.metvuw.com/forecast/2021051718/rain-nz-2021051718-006.gif",
    },
    {
      url: "http://www.metvuw.com/forecast/2021051718/rain-nz-2021051718-012.gif",
    },
    {
      url: "http://www.metvuw.com/forecast/2021051718/rain-nz-2021051718-018.gif",
    },
  ];
  res.status(200).json(charts);
};
