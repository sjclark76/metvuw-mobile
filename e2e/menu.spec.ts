import { expect, test } from '@playwright/test'

test.describe('navigation menu on a desktop', () => {
  test.use({ viewport: { width: 1600, height: 900 } })

  const toggle = (page: import('@playwright/test').Page, name: string) =>
    page.getByRole('button', { name, exact: true })

  test('opens with the keyboard, moves with the arrow keys and closes with Escape', async ({
    page,
  }) => {
    await page.goto('/satellite')
    const australia = toggle(page, 'Australia')
    await expect(australia).toHaveAttribute('aria-expanded', 'false')

    await australia.focus()
    await page.keyboard.press('ArrowDown')

    await expect(australia).toHaveAttribute('aria-expanded', 'true')
    await expect(
      page.getByRole('link', { name: 'Victoria & Tasmania' }),
    ).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(
      page.getByRole('link', { name: 'New South Wales' }),
    ).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(australia).toHaveAttribute('aria-expanded', 'false')
    await expect(australia).toBeFocused()
  })

  test('Tab leaves an open menu instead of being swallowed', async ({
    page,
  }) => {
    await page.goto('/satellite')
    const australia = toggle(page, 'Australia')
    await australia.focus()
    await page.keyboard.press('Enter')
    await expect(australia).toHaveAttribute('aria-expanded', 'true')

    for (let i = 0; i < 12; i++) await page.keyboard.press('Tab')

    await expect(australia).toHaveAttribute('aria-expanded', 'false')
  })

  test('choosing a region goes there', async ({ page }) => {
    await page.goto('/satellite')

    await toggle(page, 'Australia').click()
    await page.getByRole('link', { name: 'Perth' }).click()

    await expect(page).toHaveURL(/\/regions\/swaussie$/)
    await expect(
      page.getByRole('heading', { name: /forecast issued at .* for perth/i }),
    ).toBeVisible()
  })

  test('a press outside closes it', async ({ page }) => {
    await page.goto('/satellite')
    await toggle(page, 'Europe').click()
    await expect(toggle(page, 'Europe')).toHaveAttribute(
      'aria-expanded',
      'true',
    )

    // Blank page below the navigation bar and the open list.
    await page.mouse.click(20, 700)

    await expect(toggle(page, 'Europe')).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })
})

test.describe('navigation menu on a phone', () => {
  test.use({ viewport: { width: 390, height: 800 } })

  test('opens from the menu button, and closes after choosing a page @mobile', async ({
    page,
  }) => {
    await page.goto('/')
    const menu = page.getByRole('button', { name: 'Menu' })
    await expect(menu).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByRole('link', { name: 'Satellite' })).toBeHidden()

    await menu.click()
    await expect(menu).toHaveAttribute('aria-expanded', 'true')
    await page.getByRole('link', { name: 'Satellite' }).click()

    await expect(page).toHaveURL(/\/satellite$/)
    await expect(menu).toHaveAttribute('aria-expanded', 'false')
  })
})
