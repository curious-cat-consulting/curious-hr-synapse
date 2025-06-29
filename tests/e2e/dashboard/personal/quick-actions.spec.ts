import { test, expect } from "@playwright/test";

import {
  setupTestUserAndSignIn,
  generateTestEmail,
  cleanupTestData,
  waitForDashboard,
} from "../../helpers/test-utils";

test.describe("Personal Dashboard QuickActions", () => {
  let testEmail: string;
  let testUserId: string | undefined;

  test.beforeEach(async () => {
    // Generate unique test email for each test run
    testEmail = generateTestEmail();
  });

  test.afterEach(async () => {
    // Comprehensive cleanup that handles both API-created and signup-created users
    await cleanupTestData(testEmail, testUserId);
  });

  test("All QuickActions buttons work correctly", async ({ page }) => {
    // Setup test user and sign in
    testUserId = await setupTestUserAndSignIn(page, testEmail);

    // Test 1: Submit Expense button - should open expense drawer
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

    // Test 2: My Expenses button - should navigate to expenses page
    const myExpensesButton = page.locator('[data-testid="my-expenses-button"]');
    await expect(myExpensesButton).toBeVisible();
    await myExpensesButton.click();

    // Verify navigation to expenses page
    await expect(page).toHaveURL("/dashboard/expenses");

    // Navigate back to dashboard
    await page.goto("/dashboard");
    await waitForDashboard(page);

    // Test 3: Spending Insights button - should navigate to analytics page
    const spendingInsightsButton = page.locator('[data-testid="spending-insights-button"]');
    await expect(spendingInsightsButton).toBeVisible();
    await spendingInsightsButton.click();

    // Verify navigation to analytics page
    await expect(page).toHaveURL("/dashboard/analytics");

    // Navigate back to dashboard
    await page.goto("/dashboard");
    await waitForDashboard(page);

    // Test 4: Account Settings button - should navigate to settings page
    const accountSettingsButton = page.locator('[data-testid="account-settings-button"]');
    await expect(accountSettingsButton).toBeVisible();
    await accountSettingsButton.click();

    // Verify navigation to settings page
    await expect(page).toHaveURL("/dashboard/settings");
  });
});
