// Words that are written short and read long, on both sides of a search: "Mt Cook"
// and "Mount Cook" are the same place, and so are "St Arnaud" and "Saint Arnaud".
const SYNONYMS: Record<string, string> = {
  mt: 'mount',
  st: 'saint',
  lk: 'lake',
  pt: 'point',
  ft: 'fort',
}

/**
 * A name or a search as plain lower-case words: no accents (Whangārei is
 * whangarei), no apostrophes (Arthur’s is arthurs), no punctuation, and the short
 * forms above spelt out. The same rules apply to the places and to what is typed,
 * so they meet in the middle.
 */
export function normaliseText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’‘ʻ`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => SYNONYMS[word] ?? word)
    .join(' ')
}
