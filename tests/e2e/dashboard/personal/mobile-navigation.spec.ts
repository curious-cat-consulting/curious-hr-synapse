import { test, expect } from "@playwright/test";

import { waitForDashboard } from "../../helpers/test-utils";

test.describe("Personal Dashboard Menus", () => {
  test("Mobile navigation menu works correctly", async ({ page }) => {
    await waitForDashboard(page, true);

    // Set viewport to mobile size to make mobile menu visible
    await page.setViewportSize({ width: 375, height: 667 });

    // Open mobile menu
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(mobileMenuButton).toBeVisible();
    await mobileMenuButton.click();

    // Check that mobile menu is visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Test navigation through mobile menu
    const mobileExpensesLink = page.locator('[role="dialog"] a:has-text("Expenses")');
    await expect(mobileExpensesLink).toBeVisible();
    await mobileExpensesLink.click();

    // Verify navigation to expenses page
    await expect(page).toHaveURL("/dashboard/expenses");
  });
});
