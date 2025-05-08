import axios from 'axios'
import * as cheerio from 'cheerio'

import { config } from '@/config'

/**
 * This function is used to load images from a given URL.
 * It uses axios to make a GET request to the URL and cheerio to parse the HTML response.
 *
 * @param {string} url - The URL from which to load the images.
 * @param {string} imageSelector - The CSS selector to use to select the images from the HTML.
 *
 * @returns {Promise<{ relativeUrl: string; width: number; height: number }[]>} - A promise that resolves to an array of objects.
 * Each object represents an image and has properties for the image's relative URL, width, and height.
 */
export async function loadImages(
  url: string,
  imageSelector: string,
): Promise<{ relativeUrl: string }[]> {
  const response = await axios.get(new URL(url, config.metvuwBaseUrl).href)
  const rawHtml = response.data

  const $ = cheerio.load(rawHtml)

  const images = $(imageSelector)

  return images.toArray().map((image: any) => ({
    relativeUrl: image.attribs.src as string,
  }))
}
