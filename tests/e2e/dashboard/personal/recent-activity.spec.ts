import { test, expect } from "@playwright/test";

import {
  cleanupTestData,
  generateTestEmail,
  setupTestUserAndSignIn,
  waitForDashboard,
  waitForLoginPage,
  signIn,
} from "../../helpers/test-utils";

test.use({ storageState: "./tests/e2e/no-state.json" });

test.describe("Personal Dashboard RecentActivity", () => {
  let testEmail: string;
  let testUserId: string | undefined;

  test.afterEach(async () => {
    if (testUserId !== undefined) {
      // Clean up the test user and all associated data
      await cleanupTestData(testEmail, testUserId);
    }
  });

  test("shows empty state when no expenses exist", async ({ page }) => {
    // Generate unique test email for each test run
    testEmail = generateTestEmail("recent-activity-test");

    // Setup test user and sign them in
    testUserId = await setupTestUserAndSignIn(page, testEmail);

    await waitForDashboard(page, true);

    // Verify empty state is displayed
    await expect(page.locator('h2:has-text("Recent Activity")')).toBeVisible();
    await expect(
      page.locator("text=Recent activity will appear here as you start submitting expenses")
    ).toBeVisible();

    // Look for Clock icon using data-testid
    await expect(page.locator('[data-testid="recent-activity-empty-clock"]')).toBeVisible();
  });

  test("shows all expected fields for expenses", async ({ page }) => {
    // Use the seeded test user with expenses
    testEmail = "test2@curiouscat.consulting";
    testUserId = "88888888-8888-8888-8888-888888888888";

    // Sign in with the seeded user
    await waitForLoginPage(page);
    await signIn(page, testEmail);

    await waitForDashboard(page);

    // Wait a bit for the component to load data
    await page.waitForTimeout(2000);

    // Verify Recent Activity section is visible
    await expect(page.locator('h2:has-text("Recent Activity")')).toBeVisible();

    // Verify only 5 expenses are shown (limit is 5)
    const expenseItems = page.locator('[data-testid="recent-activity"] li');
    await expect(expenseItems).toHaveCount(5);

    // Verify the seeded expenses are displayed
    const expectedExpenses = [
      { title: "Office Supplies Purchase", amount: 123.45, status: "NEW" },
      { title: "Test Expense 1", amount: 50.0, status: "PENDING" },
      { title: "Test Expense 2", amount: 75.5, status: "APPROVED" },
      { title: "Test Expense 3", amount: 25.99, status: "REJECTED" },
      { title: "Test Expense 4", amount: 100.0, status: "ANALYZED" },
    ];

    for (const expense of expectedExpenses) {
      await expect(page.locator(`text=${expense.title}`)).toBeVisible();
      await expect(page.locator(`text=$${expense.amount.toFixed(2)}`)).toBeVisible();
      await expect(
        page.locator(`[data-testid="expense-status-${expense.status.toLowerCase()}"]`)
      ).toBeVisible();
    }
  });

  test("shows correct expense details with proper formatting", async ({ page }) => {
    // Use the seeded test user with expenses
    testEmail = "test2@curiouscat.consulting";
    testUserId = "88888888-8888-8888-8888-888888888888";

    // Sign in with the seeded user
    await waitForLoginPage(page);
    await signIn(page, testEmail);

    await waitForDashboard(page);

    // Wait a bit for the component to load data
    await page.waitForTimeout(2000);

    // Verify all expected fields are present for the first expense
    await expect(page.locator("text=#5")).toBeVisible(); // Account expense ID for Office Supplies Purchase
    await expect(page.locator("text=Office Supplies Purchase")).toBeVisible(); // Title
    await expect(page.locator("text=$123.45")).toBeVisible(); // Amount
    await expect(page.locator('[data-testid="expense-status-new"]')).toBeVisible(); // Status

    // Verify date is displayed (should be today's date for the most recent expense)
    const today = new Date().toLocaleDateString();
    await expect(page.locator(`text=${today}`)).toBeVisible();
  });

  test("shows correct status styling", async ({ page }) => {
    // Use the seeded test user with expenses
    testEmail = "test2@curiouscat.consulting";
    testUserId = "88888888-8888-8888-8888-888888888888";

    // Sign in with the seeded user
    await waitForLoginPage(page);
    await signIn(page, testEmail);

    await waitForDashboard(page);

    // Wait a bit for the component to load data
    await page.waitForTimeout(2000);

    // Verify each status is visible and has proper styling
    const statuses = ["pending", "approved", "rejected", "analyzed", "new"];

    for (const status of statuses) {
      // Find the status element using the specific data-testid
      const statusElement = page.locator(`[data-testid="expense-status-${status}"]`);

      await expect(statusElement).toBeVisible();

      // Check that the status has the appropriate styling class
      await expect(statusElement).toHaveClass(/rounded-full.*px-2.*py-1.*text-xs/);
    }
  });
});
