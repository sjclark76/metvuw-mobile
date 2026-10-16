// Upper bound on decoded input size (4000 x 4000). The charts we process are far
// smaller; this stops a tiny, highly compressed file expanding into a huge
// bitmap in memory.
export const MAX_INPUT_PIXELS = 16_000_000

export const sharpInputOptions = { limitInputPixels: MAX_INPUT_PIXELS }
