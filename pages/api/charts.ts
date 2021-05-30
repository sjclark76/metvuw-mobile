import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import * as cheerio from "cheerio";

export interface ChartResponse {
  url: string;
  width: number;
  height: number;
}

export async function getImageUrls(region: string): Promise<ChartResponse[]> {
  try {
    const response = await axios.get(
      "http://www.metvuw.com/forecast/forecast.php?type=rain&region=nz&noofdays=10"
    );

    let rawHtml = response.data;

    const $ = cheerio.load(rawHtml);

    const images: cheerio.Cheerio = $("img[src*=rain]");

    return images.toArray().map((element: any) => {
      const relativeUrl = element.attribs.src;
      const url = new URL(
        `forecast/${relativeUrl.substr(2)}`,
        "http://www.metvuw.com"
      );
      return {
        url: url.href,
        width: element.attribs.width,
        height: element.attribs.height,
      };
    });
  } catch (e) {
    console.log(e);
  }
}
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const charts: ChartResponse[] = await getImageUrls("asfd");
  res.status(200).json(charts);
};
