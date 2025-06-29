import { test, expect } from "@playwright/test";

import { waitForDashboard } from "../../helpers/test-utils";

test.describe("Personal Dashboard QuickActions", () => {
  test("Submit Expense button opens expense drawer", async ({ page }) => {
    await waitForDashboard(page, true);

    const submitExpenseButton = page.locator(
      '[data-testid="quick-actions-new-expense"] [data-testid="new-expense-button"]'
    );
    await expect(submitExpenseButton).toBeVisible();
    await submitExpenseButton.click();

    // Verify expense drawer opens
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2:has-text("New Expense Report")')).toBeVisible();

    // Close the drawer by clicking outside or escape
    await page.keyboard.press("Escape");
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test("My Expenses button navigates to expenses page", async ({ page }) => {
    await waitForDashboard(page, true);

    const myExpensesButton = page.locator('[data-testid="my-expenses-button"]');
    await expect(myExpensesButton).toBeVisible();
    await myExpensesButton.click();

    // Verify navigation to expenses page
    await expect(page).toHaveURL("/dashboard/expenses");
  });

  test("Spending Insights button navigates to analytics page", async ({ page }) => {
    await waitForDashboard(page, true);

    const spendingInsightsButton = page.locator('[data-testid="spending-insights-button"]');
    await expect(spendingInsightsButton).toBeVisible();
    await spendingInsightsButton.click();

    // Verify navigation to analytics page
    await expect(page).toHaveURL("/dashboard/analytics");
  });

  test("Account Settings button navigates to settings page", async ({ page }) => {
    await waitForDashboard(page, true);

    const accountSettingsButton = page.locator('[data-testid="account-settings-button"]');
    await expect(accountSettingsButton).toBeVisible();
    await accountSettingsButton.click();

    // Verify navigation to settings page
    await expect(page).toHaveURL("/dashboard/settings");
  });
});
