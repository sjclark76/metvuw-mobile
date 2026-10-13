// Phones show two or three charts at a time. The first few images load eagerly
// (they are what the visitor sees, and what LCP measures); the rest are lazy so
// the browser only fetches them as they approach the viewport.
export const EAGER_IMAGE_COUNT = 2

export function imageLoadingFor(index: number): 'eager' | 'lazy' {
  return index < EAGER_IMAGE_COUNT ? 'eager' : 'lazy'
}
