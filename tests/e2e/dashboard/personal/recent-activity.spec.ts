import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import {
  waitForDashboard,
  generateTestEmail,
  setupTestUserAndSignIn,
  cleanupTestData,
} from "../../helpers/test-utils";

// Supabase configuration for test data setup
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

test.describe("Personal Dashboard RecentActivity", () => {
  let testEmail: string;
  let testUserId: string | undefined;
  let createdExpenseIds: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Generate unique test email for each test run
    testEmail = generateTestEmail("recent-activity-test");

    // Setup test user and sign them in
    testUserId = await setupTestUserAndSignIn(page, testEmail);
  });

  test.afterEach(async () => {
    // Clean up test data using the stored expense IDs
    if (createdExpenseIds.length > 0) {
      await supabase.rpc("delete_expenses_by_ids", { p_expense_ids: createdExpenseIds });
      createdExpenseIds = []; // Reset for next test
    }

    // Clean up the test user and all associated data
    await cleanupTestData(testEmail, testUserId);
  });

  test("shows empty state when no expenses exist", async ({ page }) => {
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
    // Create test expenses using RPC
    const testExpenses = [
      { title: "Test Expense 1", amount: 50.0, status: "PENDING" },
      { title: "Test Expense 2", amount: 75.5, status: "APPROVED" },
      { title: "Test Expense 3", amount: 25.99, status: "REJECTED" },
      { title: "Test Expense 4", amount: 100.0, status: "ANALYZED" },
      { title: "Test Expense 5", amount: 45.75, status: "NEW" },
      { title: "Test Expense 6", amount: 200.0, status: "PENDING" }, // This should not appear (limit is 5)
    ];

    // Convert test expenses to the format expected by the RPC
    const expenseData = testExpenses.map((expense, index) => ({
      title: expense.title,
      description: `Description for ${expense.title}`,
      amount: expense.amount,
      status: expense.status,
      created_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(), // Different dates
    }));

    // Create expenses using RPC (this handles counter management automatically)
    const { data: expenseIds, error } = await supabase.rpc("create_fake_expenses", {
      p_user_email: testEmail,
      p_count: testExpenses.length,
      p_account_id: testUserId,
      p_expense_data: expenseData,
    });

    if (error !== null) {
      throw new Error(`Failed to create test expenses: ${error.message}`);
    }

    // Store the expense IDs for cleanup
    if (expenseIds !== null) {
      createdExpenseIds = expenseIds;
    }

    // Navigate to dashboard and wait for it to load
    await page.goto("/dashboard");
    await waitForDashboard(page, true);

    // Wait a bit for the component to load data
    await page.waitForTimeout(2000);

    // Verify Recent Activity section is visible
    await expect(page.locator('h2:has-text("Recent Activity")')).toBeVisible();

    // Verify only 5 expenses are shown (not 6)
    const expenseItems = page.locator('[data-testid="recent-activity"] li');
    await expect(expenseItems).toHaveCount(5);

    // Verify the first 5 expenses are displayed (not the 6th one)
    for (let i = 0; i < 5; i++) {
      const expense = testExpenses[i];
      await expect(page.locator(`text=${expense.title}`)).toBeVisible();
      await expect(page.locator(`text=$${expense.amount.toFixed(2)}`)).toBeVisible();
      await expect(
        page.locator(`[data-testid="expense-status-${expense.status.toLowerCase()}"]`)
      ).toBeVisible();
    }

    // Verify the 6th expense is NOT displayed
    await expect(page.locator(`text=${testExpenses[5].title}`)).not.toBeVisible();
  });

  test("shows correct expense details with proper formatting", async ({ page }) => {
    // Create a single test expense using RPC
    const testExpense = {
      title: "Office Supplies Purchase",
      amount: 123.45,
      status: "APPROVED",
      description: "Purchased office supplies for the team",
    };

    const { data: expenseIds, error } = await supabase.rpc("create_fake_expenses", {
      p_user_email: testEmail,
      p_count: 1,
      p_account_id: testUserId,
      p_expense_data: [
        {
          title: testExpense.title,
          description: testExpense.description,
          amount: testExpense.amount,
          status: testExpense.status,
          created_at: new Date().toISOString(),
        },
      ],
    });

    if (error !== null) {
      throw new Error(`Failed to create test expense: ${error.message}`);
    }

    // Store the expense IDs for cleanup
    if (expenseIds !== null) {
      createdExpenseIds = expenseIds;
    }

    // Navigate to dashboard
    await page.goto("/dashboard");
    await waitForDashboard(page, true);

    // Wait a bit for the component to load data
    await page.waitForTimeout(2000);

    // Verify all expected fields are present
    await expect(page.locator("text=#1")).toBeVisible(); // Account expense ID
    await expect(page.locator(`text=${testExpense.title}`)).toBeVisible(); // Title
    await expect(page.locator(`text=$${testExpense.amount.toFixed(2)}`)).toBeVisible(); // Amount
    await expect(
      page.locator(`[data-testid="expense-status-${testExpense.status.toLowerCase()}"]`)
    ).toBeVisible(); // Status

    // Verify date is displayed (should be today's date)
    const today = new Date().toLocaleDateString();
    await expect(page.locator(`text=${today}`)).toBeVisible();
  });

  test("shows correct status styling", async ({ page }) => {
    // Create expenses with different statuses using RPC
    const statuses = ["PENDING", "APPROVED", "REJECTED", "ANALYZED", "NEW"];

    const expenseData = statuses.map((status, index) => ({
      title: `Test Expense ${index + 1}`,
      description: `Description ${index + 1}`,
      amount: 50.0,
      status: status,
      created_at: new Date().toISOString(),
    }));

    const { data: expenseIds, error } = await supabase.rpc("create_fake_expenses", {
      p_user_email: testEmail,
      p_count: statuses.length,
      p_account_id: testUserId,
      p_expense_data: expenseData,
    });

    if (error !== null) {
      throw new Error(`Failed to create test expenses: ${error.message}`);
    }

    // Store the expense IDs for cleanup
    if (expenseIds !== null) {
      createdExpenseIds = expenseIds;
    }

    // Navigate to dashboard
    await page.goto("/dashboard");
    await waitForDashboard(page, true);

    // Wait a bit for the component to load data
    await page.waitForTimeout(2000);

    // Verify each status is visible and has proper styling
    for (const status of statuses) {
      // Find the status element using the specific data-testid
      const statusElement = page.locator(`[data-testid="expense-status-${status.toLowerCase()}"]`);

      await expect(statusElement).toBeVisible();

      // Check that the status has the appropriate styling class
      await expect(statusElement).toHaveClass(/rounded-full.*px-2.*py-1.*text-xs/);
    }
  });
});
