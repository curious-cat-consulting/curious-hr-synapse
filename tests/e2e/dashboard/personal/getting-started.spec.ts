import { test, expect } from "@playwright/test";

import { waitForDashboard } from "../../helpers/test-utils";

test.describe("Personal Dashboard GettingStarted", () => {
  test("Submit First Expense link opens expense drawer", async ({ page }) => {
    await waitForDashboard(page, true);

    // Find the "Submit Your First Expense" step and click the action button
    const submitExpenseButton = page
      .locator('h3:has-text("Submit Your First Expense")')
      .locator("..")
      .locator('[data-testid="new-expense-button"]');

    await expect(submitExpenseButton).toBeVisible();
    await submitExpenseButton.click();

    // Verify expense drawer opens
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2:has-text("New Expense Report")')).toBeVisible();

    // Close the drawer
    await page.keyboard.press("Escape");
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test("GettingStarted links are visible and clickable", async ({ page }) => {
    await waitForDashboard(page, true);

    // Verify all GettingStarted links are present
    await expect(page.locator('a:has-text("View My Expenses →")')).toBeVisible();
    await expect(page.locator('a:has-text("Account Settings →")')).toBeVisible();

    // Verify the links have proper href attributes
    const viewExpensesLink = page.locator('a:has-text("View My Expenses →")');
    const settingsLink = page.locator('a:has-text("Account Settings →")');

    await expect(viewExpensesLink).toHaveAttribute("href", "/dashboard/expenses");
    await expect(settingsLink).toHaveAttribute("href", "/dashboard/settings");
  });

  test("GettingStarted steps are displayed correctly", async ({ page }) => {
    await waitForDashboard(page, true);

    // Verify all three steps are present
    await expect(page.locator('h3:has-text("Submit Your First Expense")')).toBeVisible();
    await expect(page.locator('h3:has-text("Review and Track")')).toBeVisible();
    await expect(page.locator('h3:has-text("Customize Settings")')).toBeVisible();

    // Verify step numbers are displayed (be more specific to avoid conflicts)
    await expect(
      page.locator('h3:has-text("Submit Your First Expense")').locator("..").locator("text=1")
    ).toBeVisible();
    await expect(
      page.locator('h3:has-text("Review and Track")').locator("..").locator("text=2")
    ).toBeVisible();
    await expect(
      page.locator('h3:has-text("Customize Settings")').locator("..").locator("text=3")
    ).toBeVisible();
  });
});
