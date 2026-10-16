import { ScrapedImage } from '@/shared/helpers/screenScraper/scrapedImage'
import { ScrapeError } from '@/shared/helpers/screenScraper/scrapeError'

/**
 * Keeps the images whose filenames were recognised, reporting the ones that
 * weren't. Throws if none were, because that means the markup or naming
 * scheme changed and every chart would otherwise be dropped silently.
 */
export function collectScrapedImages(
  images: (ScrapedImage | undefined)[],
  sources: { relativeUrl: string }[],
  what: string,
): ScrapedImage[] {
  const recognised = images.filter(
    (image): image is ScrapedImage => image !== undefined,
  )

  images.forEach((image, index) => {
    if (image === undefined) {
      // eslint-disable-next-line no-console
      console.warn(
        `skipping unrecognised ${what} image: ${sources[index].relativeUrl}`,
      )
    }
  })

  if (recognised.length === 0) {
    throw new ScrapeError(`none of the ${what} images had a recognised name`)
  }
  return recognised
}
