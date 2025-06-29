import { test } from "@playwright/test";

import {
  createExpenseFromQuickActions,
  generateTestEmail,
  cleanupTestData,
  setupTestUserAndSignIn,
  verifyExpenseCreated,
  testExpenseFormValidation,
} from "../../helpers/test-utils";

// Test configuration
const TEST_EXPENSE_TITLE = "Test Expense Report";
const TEST_EXPENSE_DESCRIPTION = "This is a test expense created by Playwright E2E test";

test.describe("Expense Creation E2E", () => {
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

  test("Complete expense creation and verification flow", async ({ page }) => {
    // Setup test user and sign in
    testUserId = await setupTestUserAndSignIn(page, testEmail);

    // Create a new expense from quick actions
    await createExpenseFromQuickActions(page, TEST_EXPENSE_TITLE, TEST_EXPENSE_DESCRIPTION);

    // Verify the expense was created
    await verifyExpenseCreated(page, TEST_EXPENSE_TITLE, TEST_EXPENSE_DESCRIPTION);
  });

  test("Expense creation with validation", async ({ page }) => {
    // Setup test user and sign in
    testUserId = await setupTestUserAndSignIn(page, testEmail);

    // Test form validation and create expense
    await testExpenseFormValidation(page, TEST_EXPENSE_DESCRIPTION, TEST_EXPENSE_TITLE);

    // Verify expense was created
    await verifyExpenseCreated(page, TEST_EXPENSE_TITLE, TEST_EXPENSE_DESCRIPTION);
  });
});
