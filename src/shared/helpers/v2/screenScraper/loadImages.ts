import * as cheerio from 'cheerio'

import { config } from '@/config'

export async function loadImages(
  url: string,
  imageSelector: string,
): Promise<{ relativeUrl: string }[]> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    const response = await fetch(new URL(url, config.metvuwBaseUrl).href, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    const rawHtml = await response.text()

    const $ = cheerio.load(rawHtml)

    const images = $(imageSelector)

    return images.toArray().map((image: any) => ({
      relativeUrl: image.attribs.src as string,
    }))
  } catch (error) {
    console.error(`Failed to load images from ${url}:`, error instanceof Error ? error.message : error)
    return []
  }
}
