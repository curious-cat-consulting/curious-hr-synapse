import { test, expect } from "@playwright/test";

import { waitForTeamDashboard } from "../../helpers/test-utils";

test.describe("Team Dashboard Navigation", () => {
  test("Overview link navigates to team dashboard home", async ({ page }) => {
    await waitForTeamDashboard(page);

    // Navigate to a different page first to test the navigation
    await page.goto("/dashboard/test-team/expenses");
    await expect(page).toHaveURL("/dashboard/test-team/expenses");

    const overviewLink = page.locator('nav a:has-text("Overview")');
    await expect(overviewLink).toBeVisible();
    await overviewLink.click();

    // Verify navigation to team dashboard home
    await expect(page).toHaveURL("/dashboard/test-team");
  });

  test("Expenses link navigates to team expenses page", async ({ page }) => {
    await waitForTeamDashboard(page);

    const expensesLink = page.locator('nav a:has-text("Expenses")');
    await expect(expensesLink).toBeVisible();
    await expensesLink.click();

    // Verify navigation to team expenses page
    await expect(page).toHaveURL("/dashboard/test-team/expenses");
  });

  test("Analytics link navigates to team analytics page", async ({ page }) => {
    await waitForTeamDashboard(page);

    const analyticsLink = page.locator('nav a:has-text("Analytics")');
    await expect(analyticsLink).toBeVisible();
    await analyticsLink.click();

    // Verify navigation to team analytics page
    await expect(page).toHaveURL("/dashboard/test-team/analytics");
  });

  test("Settings link navigates to team settings page", async ({ page }) => {
    await waitForTeamDashboard(page);

    const settingsLink = page.locator('nav a:has-text("Settings")');
    await expect(settingsLink).toBeVisible();
    await settingsLink.click();

    // Verify navigation to team settings page
    await expect(page).toHaveURL("/dashboard/test-team/settings");
  });
});
