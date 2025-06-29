import { test, expect } from "@playwright/test";

import { waitForDashboard } from "../../helpers/test-utils";

test.describe("Personal Dashboard Navigation", () => {
  test("Overview link navigates to dashboard home", async ({ page }) => {
    await waitForDashboard(page, true);

    // Navigate to a different page first to test the navigation
    await page.goto("/dashboard/expenses");
    await expect(page).toHaveURL("/dashboard/expenses");

    const overviewLink = page.locator('nav a:has-text("Overview")');
    await expect(overviewLink).toBeVisible();
    await overviewLink.click();

    // Verify navigation to dashboard home
    await expect(page).toHaveURL("/dashboard");
  });

  test("Expenses link navigates to expenses page", async ({ page }) => {
    await waitForDashboard(page, true);

    const expensesLink = page.locator('nav a:has-text("Expenses")');
    await expect(expensesLink).toBeVisible();
    await expensesLink.click();

    // Verify navigation to expenses page
    await expect(page).toHaveURL("/dashboard/expenses");
  });

  test("Analytics link navigates to analytics page", async ({ page }) => {
    await waitForDashboard(page, true);

    const analyticsLink = page.locator('nav a:has-text("Analytics")');
    await expect(analyticsLink).toBeVisible();
    await analyticsLink.click();

    // Verify navigation to analytics page
    await expect(page).toHaveURL("/dashboard/analytics");
  });

  test("Settings link navigates to settings page", async ({ page }) => {
    await waitForDashboard(page, true);

    const settingsLink = page.locator('nav a:has-text("Settings")');
    await expect(settingsLink).toBeVisible();
    await settingsLink.click();

    // Verify navigation to settings page
    await expect(page).toHaveURL("/dashboard/settings");
  });
});
