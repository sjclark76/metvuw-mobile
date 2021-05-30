import { getImageUrls } from "./charts/[region]";

describe("", () => {
  it("blh", async () => {
    const result = await getImageUrls("f");
    console.debug(result);
  });
});
