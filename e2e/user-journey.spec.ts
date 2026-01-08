import { test, expect } from '@playwright/test';

/**
 * E2E Test: Complete User Journey
 * Tests the full flow from landing page through calculator to results
 */

test.describe('User Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display landing page with CTA', async ({ page }) => {
    // Check hero section
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Check CTA button exists
    const ctaButton = page.getByRole('link', { name: /free quote|get started|calculate/i });
    await expect(ctaButton).toBeVisible();
  });

  test('should navigate to calculator from landing page', async ({ page }) => {
    // Click CTA to go to calculator
    await page
      .getByRole('link', { name: /free quote|get started|calculate/i })
      .first()
      .click();

    // Should be on calculator page
    await expect(page).toHaveURL(/calculator/);
  });

  test('should complete postcode step', async ({ page }) => {
    await page.goto('/calculator');

    // Enter a valid UK postcode
    const postcodeInput = page.getByPlaceholder(/postcode/i);
    await postcodeInput.fill('SW1A 1AA');

    // Click lookup or next
    const lookupButton = page.getByRole('button', { name: /look up|find|next/i }).first();
    await lookupButton.click();

    // Wait for location confirmation or next step
    await expect(page.getByText(/london|westminster|location|step 2/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should show results page with key metrics', async ({ page }) => {
    // Navigate directly to results with mock data in session storage
    await page.evaluate(() => {
      const mockInputs = {
        postcode: 'SW1A 1AA',
        latitude: 51.5,
        longitude: -0.14,
        roofOrientation: 'S',
        roofPitch: 35,
        roofArea: 30,
        shadingFactor: 1.0,
        annualElectricityUsage: 3500,
        homeOccupancy: 'daytime',
      };
      sessionStorage.setItem('calculatorInputs', JSON.stringify(mockInputs));
    });

    await page.goto('/results');

    // Check for key metrics
    await expect(page.getByText(/kWp|kW/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/£/i).first()).toBeVisible();
    await expect(page.getByText(/year|payback/i).first()).toBeVisible();
  });

  test('should display CTA on results page', async ({ page }) => {
    // Set up mock data
    await page.evaluate(() => {
      const mockInputs = {
        postcode: 'SW1A 1AA',
        latitude: 51.5,
        longitude: -0.14,
        roofOrientation: 'S',
        roofPitch: 35,
        roofArea: 30,
        shadingFactor: 1.0,
        annualElectricityUsage: 3500,
        homeOccupancy: 'daytime',
      };
      sessionStorage.setItem('calculatorInputs', JSON.stringify(mockInputs));
    });

    await page.goto('/results');

    // Check for CTA buttons
    const ctaSection = page.locator('text=/quote|report|contact/i').first();
    await expect(ctaSection).toBeVisible({ timeout: 10000 });
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Hero should still be visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // CTA should be visible
    await expect(
      page.getByRole('link', { name: /free quote|get started|calculate/i }).first()
    ).toBeVisible();
  });

  test('should not have console errors on landing page', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out expected errors (e.g., favicon, API not available in test)
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes('favicon') &&
        !err.includes('postcodes.io') &&
        !err.includes('Failed to fetch')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');

    // Should have exactly one h1
    const h1Elements = await page.getByRole('heading', { level: 1 }).all();
    expect(h1Elements.length).toBe(1);
  });

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/calculator');

    // Form inputs should have associated labels
    const inputs = await page.locator('input').all();
    for (const input of inputs) {
      const ariaLabel = await input.getAttribute('aria-label');
      const id = await input.getAttribute('id');
      const label = id ? await page.locator(`label[for="${id}"]`).count() : 0;
      const placeholder = await input.getAttribute('placeholder');

      // Should have either aria-label, associated label, or placeholder
      expect(ariaLabel || label > 0 || placeholder).toBeTruthy();
    }
  });
});
