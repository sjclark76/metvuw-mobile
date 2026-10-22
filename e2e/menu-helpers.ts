import { expect, Page } from '@playwright/test'

/**
 * Opens the navigation, whichever form it has: from 1024px wide it is a column
 * down the side and always there; below that it is opened with the hamburger.
 */
export async function openMenu(page: Page) {
  const hamburger = page.getByRole('button', { name: 'Menu' })
  if (await hamburger.isVisible()) {
    if ((await hamburger.getAttribute('aria-expanded')) !== 'true') {
      await hamburger.click()
    }
  }
  await expect(page.locator('#site-menu')).toBeVisible()
}

/**
 * Opens a group of the navigation (New Zealand, Radar...) if it is not open
 * already: in the side menu the group with the current page starts open, and
 * pressing its button would close it.
 */
export async function openGroup(page: Page, name: string) {
  const button = page.getByRole('button', { name, exact: true })
  if ((await button.getAttribute('aria-expanded')) !== 'true') {
    await button.click()
  }
  await expect(button).toHaveAttribute('aria-expanded', 'true')
}
