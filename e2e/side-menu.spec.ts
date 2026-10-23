import AxeBuilder from '@axe-core/playwright'
import { expect, Page, test } from '@playwright/test'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const MENU_WIDTH = 256 // 16rem

const menu = (page: Page) => page.locator('#site-menu')
const hamburger = (page: Page) => page.getByRole('button', { name: 'Menu' })
const group = (page: Page, name: string) =>
  menu(page).getByRole('button', { name, exact: true })

async function open(page: Page, path: string) {
  await page.goto(path)
  await page.waitForSelector('main img')
}

// From 1024px wide the menu is a column down the left; below it is the hamburger.
test.describe('on a large screen', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('the menu is a column down the left, with no hamburger', async ({
    page,
  }) => {
    await open(page, '/regions/nzsi')

    await expect(hamburger(page)).toBeHidden()
    const box = (await menu(page).boundingBox())!
    expect(box.x).toBe(0)
    expect(box.width).toBe(MENU_WIDTH)
    // Under the bar, down to the bottom of the screen.
    expect(box.y).toBeGreaterThanOrEqual(60)
    expect(box.y + box.height).toBeCloseTo(900, 0)
  })

  test('names its sections, and puts Saved, Pins, Settings and Contact under Yours', async ({
    page,
  }) => {
    await open(page, '/regions/nzsi')

    const titles = menu(page).getByRole('heading', { level: 2 })
    await expect(titles).toHaveText([
      'Forecast charts',
      'Observations',
      'Yours',
    ])
    for (const name of ['Saved', 'Pins', 'Settings', 'Contact']) {
      await expect(
        menu(page).getByText(name, { exact: false }).first(),
      ).toBeVisible()
    }
  })

  test('has the group with the current page open, and the page marked', async ({
    page,
  }) => {
    await open(page, '/regions/nzsi')

    await expect(group(page, 'New Zealand')).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    const current = menu(page).getByRole('link', { name: 'South Island' })
    await expect(current).toBeVisible()
    await expect(current).toHaveAttribute('aria-current', 'page')
    await expect(group(page, 'Australia')).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    await expect(menu(page).getByRole('link', { name: 'Perth' })).toBeHidden()
  })

  test('opens and closes a group when its button is pressed, and any number can be open', async ({
    page,
  }) => {
    await open(page, '/regions/nzsi')

    await group(page, 'Australia').click()
    await expect(menu(page).getByRole('link', { name: 'Perth' })).toBeVisible()
    await expect(
      menu(page).getByRole('link', { name: 'South Island' }),
    ).toBeVisible()

    await group(page, 'Australia').click()
    await expect(menu(page).getByRole('link', { name: 'Perth' })).toBeHidden()
  })

  test('leaves a group open when something else is clicked', async ({
    page,
  }) => {
    await open(page, '/regions/nzsi')
    await group(page, 'Australia').click()

    await page.locator('main h1').click()

    await expect(menu(page).getByRole('link', { name: 'Perth' })).toBeVisible()
  })

  test('opens the group of the page you go to, with no reload', async ({
    page,
  }) => {
    await open(page, '/regions/nzsi')
    await group(page, 'Radar').click()

    await menu(page).getByRole('link', { name: 'Auckland' }).first().click()
    await page.waitForSelector('main img')

    await expect(page).toHaveURL(/\/radar\/ak$/)
    await expect(group(page, 'Radar')).toHaveAttribute('aria-expanded', 'true')
    await expect(
      menu(page).getByRole('link', { name: 'Auckland' }).first(),
    ).toHaveAttribute('aria-current', 'page')
  })

  test('keeps the charts and the footer clear of the menu', async ({
    page,
  }) => {
    await open(page, '/regions/nzsi')

    const chart = (await page.locator('main img').first().boundingBox())!
    expect(chart.x).toBeGreaterThanOrEqual(MENU_WIDTH)
    const footer = (await page.locator('footer').boundingBox())!
    expect(footer.x).toBe(MENU_WIDTH)
    expect(footer.x + footer.width).toBeCloseTo(1440, 0)
  })

  test('centres the charts in the space beside the menu', async ({ page }) => {
    await open(page, '/regions/nzsi')

    const chart = (await page.locator('main img').first().boundingBox())!
    const left = chart.x - MENU_WIDTH
    const right = 1440 - (chart.x + chart.width)
    expect(Math.abs(left - right)).toBeLessThan(40)
  })

  test('the radar key and the rainfall key are not behind the menu', async ({
    page,
  }) => {
    await open(page, '/regions/nzsi')

    const key = (await page
      .getByRole('button', { name: 'Show rainfall legend' })
      .boundingBox())!
    expect(key.x).toBeGreaterThan(MENU_WIDTH)
  })

  for (const colorScheme of ['light', 'dark'] as const) {
    test.describe(`${colorScheme} mode`, () => {
      test.use({ colorScheme })

      test('has no accessibility violations with the menu open', async ({
        page,
      }) => {
        await open(page, '/regions/nzsi')
        await group(page, 'Radar').click()
        await page.evaluate(() =>
          Promise.all(
            document
              .getAnimations()
              .map((animation) => animation.finished.catch(() => undefined)),
          ),
        )

        const results = await new AxeBuilder({ page })
          .withTags(WCAG_TAGS)
          .analyze()

        expect(results.violations).toEqual([])
      })
    })
  }
})

test.describe('on a smaller screen', () => {
  test.use({ viewport: { width: 800, height: 700 } })

  test('is the hamburger, with the menu closed until it is pressed', async ({
    page,
  }) => {
    await open(page, '/regions/nzsi')

    await expect(hamburger(page)).toBeVisible()
    await expect(menu(page)).toBeHidden()
    await expect(
      page.getByRole('heading', { name: 'Forecast charts' }),
    ).toBeHidden()

    await hamburger(page).click()

    await expect(menu(page)).toBeVisible()
    await expect(group(page, 'New Zealand')).toBeVisible()
  })

  test('has the charts as wide as before, with nothing taken for a side menu', async ({
    page,
  }) => {
    await open(page, '/regions/nzsi')

    const chart = (await page.locator('main img').first().boundingBox())!
    expect(chart.x).toBeLessThan(MENU_WIDTH)
  })

  test('opens a group as a list over the page, which closes when you go elsewhere', async ({
    page,
  }) => {
    await open(page, '/regions/nzsi')
    await hamburger(page).click()

    await group(page, 'New Zealand').click()
    await expect(
      menu(page).getByRole('link', { name: 'North Island' }),
    ).toBeVisible()
    await page.mouse.click(5, 5)

    await expect(menu(page)).toBeHidden()
  })
})
