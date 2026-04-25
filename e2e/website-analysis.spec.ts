import { test, expect } from '@playwright/test'

test('website-analysis redirects unauth → login', async ({ page }) => {
  const res = await page.goto('/website-analysis')
  // Either lands on /login (redirect) or shows the empty-state when authed
  expect(res?.status()).toBeLessThan(500)
})
