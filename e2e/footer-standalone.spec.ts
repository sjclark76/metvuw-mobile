import { expect, Page, test } from '@playwright/test'

// The installed app (display-mode: standalone) pads the footer for the phone's
// home indicator. It used to be added by a hook after mount, so the footer
// jumped on every load; CSS now applies it from the first paint.
//
// The page's scripts are blocked so the footer is exactly as it was rendered
// on the host. Browsers cannot be told to match `display-mode: standalone`
// (Chromium's media emulation ignores it), so for the installed-app cases the
// stylesheet's own `(display-mode: standalone)` conditions are switched to
// `all`, which makes the browser apply the real cascade as if it matched.
test.skip(
  ({ browserName }) => browserName !== 'chromium',
  'keeps this to one engine; the check is about the cascade, not the browser',
)

async function footerPadding(page: Page, width: number, standalone: boolean) {
  await page.route('**/*.js', (route) => route.abort())
  await page.setViewportSize({ width, height: 800 })
  await page.goto('/satellite')

  const matched = await page.evaluate((standalone) => {
    let switched = 0
    const visit = (rules: CSSRuleList) => {
      for (const rule of Array.from(rules)) {
        if (
          rule instanceof CSSMediaRule &&
          rule.media.mediaText.includes('display-mode')
        ) {
          if (standalone) rule.media.mediaText = 'all'
          switched++
        }
        if ('cssRules' in rule) visit((rule as CSSGroupingRule).cssRules)
      }
    }
    for (const sheet of Array.from(document.styleSheets)) {
      visit(sheet.cssRules)
    }
    return switched
  }, standalone)
  // The footer's standalone rules must exist in the shipped stylesheet.
  expect(matched).toBeGreaterThan(0)

  return page.locator('footer').evaluate((footer) => {
    const style = getComputedStyle(footer)
    return {
      top: style.paddingTop,
      right: style.paddingRight,
      bottom: style.paddingBottom,
      left: style.paddingLeft,
    }
  })
}

const all = (px: number) => ({
  top: `${px}px`,
  right: `${px}px`,
  bottom: `${px}px`,
  left: `${px}px`,
})

test.describe('footer padding', () => {
  test('in a browser tab, on a phone', async ({ page }) => {
    expect(await footerPadding(page, 390, false)).toEqual(all(8))
  })

  test('in a browser tab, on a desktop', async ({ page }) => {
    expect(await footerPadding(page, 1280, false)).toEqual(all(12))
  })

  test('in the installed app, on a phone, leaves room for the home indicator', async ({
    page,
  }) => {
    expect(await footerPadding(page, 390, true)).toEqual({
      top: '12px',
      right: '20px',
      bottom: '24px',
      left: '20px',
    })
  })

  test('in the installed app, on a desktop', async ({ page }) => {
    expect(await footerPadding(page, 1280, true)).toEqual(all(12))
  })
})
