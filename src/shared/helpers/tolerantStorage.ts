/**
 * localStorage, minus its exceptions. A browser that blocks it (private modes,
 * a full quota) throws on every call, and a choice that cannot be saved should
 * still take effect for the visit, not break the button that made it.
 */
export const tolerantStorage: Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem'
> = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value)
    } catch {
      // Not saved; it still applies until the page is closed.
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key)
    } catch {
      // Nothing to remove.
    }
  },
}
