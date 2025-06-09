// src/shared/utils/preloadImage.ts
export function preloadImage(url: string): void {
  if (url) {
    const img = new Image()
    img.src = url
  }
}
