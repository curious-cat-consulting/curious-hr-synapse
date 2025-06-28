import { test, expect } from "@playwright/test";

import {
  waitForLoginPage,
  signIn,
  signUp,
  waitForDashboard,
  createExpenseFromQuickActions,
  getQuickActionsNewExpenseButton,
  logout,
  generateTestEmail,
  waitForText,
  cleanupTestData,
  createTestUser,
} from "./helpers/test-utils";

// Test configuration
const TEST_PASSWORD = "curious";
const TEST_EXPENSE_TITLE = "Test Expense Report";
const TEST_EXPENSE_DESCRIPTION = "This is a test expense created by Playwright E2E test";

test.describe("User Registration and Expense Management E2E", () => {
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

  test("Complete user registration, login, expense creation, and logout flow", async ({ page }) => {
    // Step 1: Navigate to login page
    await page.goto("/login");
    await waitForLoginPage(page);

    // Step 2: Register new user
    await signUp(page, testEmail, TEST_PASSWORD);

    // Step 3: Verify redirect to login with success message
    await expect(page).toHaveURL(/\/login/);
    await waitForText(page, "Check email to continue sign in process");

    // Step 4: Sign in with the newly created account
    await signIn(page, testEmail, TEST_PASSWORD);

    // Step 5: Verify redirect to dashboard
    await waitForDashboard(page);

    // Step 6: Create a new expense from quick actions
    await createExpenseFromQuickActions(page, TEST_EXPENSE_TITLE, TEST_EXPENSE_DESCRIPTION);

    // Step 7: Navigate to expenses page to verify the expense was created
    await page.goto("/dashboard/expenses");
    await expect(page).toHaveURL("/dashboard/expenses");

    // Step 8: Verify the expense is visible in the list
    await waitForText(page, TEST_EXPENSE_TITLE);
    await waitForText(page, TEST_EXPENSE_DESCRIPTION);

    // Step 9: Logout
    await logout(page);
  });

  test("Handle existing user login flow", async ({ page }) => {
    // First, create a user via API for this test
    testUserId = await createTestUser(testEmail, TEST_PASSWORD);

    // Step 1: Navigate to login page
    await page.goto("/login");
    await waitForLoginPage(page);

    // Step 2: Sign in with existing account
    await signIn(page, testEmail, TEST_PASSWORD);

    // Step 3: Verify redirect to dashboard
    await waitForDashboard(page);

    // Step 4: Verify quick actions are visible (using specific container selectors)
    await expect(getQuickActionsNewExpenseButton(page)).toBeVisible();
    await expect(page.locator('[data-testid="my-expenses-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="spending-insights-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="account-settings-button"]')).toBeVisible();
  });

  test("Handle invalid login credentials", async ({ page }) => {
    // Step 1: Navigate to login page
    await page.goto("/login");
    await waitForLoginPage(page);

    // Step 2: Try to sign in with invalid credentials
    await signIn(page, "invalid@example.com", "wrongpassword");

    // Step 3: Verify error message is displayed
    await waitForText(page, "Could not authenticate user");
  });

  test("Form validation on login page", async ({ page }) => {
    // Step 1: Navigate to login page
    await page.goto("/login");
    await waitForLoginPage(page);

    // Step 2: Try to submit empty form
    const signInButton = page.locator('[data-testid="sign-in-button"]');
    await expect(signInButton).toBeVisible();
    await signInButton.click();

    // Step 3: Verify form validation prevents submission
    // The form should have required attributes, so browser validation should prevent submission
    await expect(page).toHaveURL("/login");

    // Step 4: Fill only email and try to submit
    await page.fill('input[name="email"]', testEmail);
    await signInButton.click();

    // Step 5: Verify still on login page (password required)
    await expect(page).toHaveURL("/login");
  });

  test("Expense creation with validation", async ({ page }) => {
    // First, create a user via API for this test
    testUserId = await createTestUser(testEmail, TEST_PASSWORD);

    // Step 1: Sign in
    await page.goto("/login");
    await signIn(page, testEmail, TEST_PASSWORD);
    await waitForDashboard(page);

    // Step 2: Try to create expense with empty title (should fail)
    const newExpenseButton = getQuickActionsNewExpenseButton(page);
    await expect(newExpenseButton).toBeVisible();
    await newExpenseButton.click();

    // Wait for drawer to open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2:has-text("New Expense Report")')).toBeVisible();

    // Fill only description (leave title empty)
    await page.fill('input[id="description"]', TEST_EXPENSE_DESCRIPTION);

    // Try to submit - should not work due to required title field
    const createButton = page.locator('[data-testid="create-expense-button"]');
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Verify drawer is still open (form validation prevented submission)
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Step 3: Create expense with valid data
    await page.fill('input[id="title"]', TEST_EXPENSE_TITLE);
    await createButton.click();

    // Verify drawer closes
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Step 4: Verify expense was created
    await page.goto("/dashboard/expenses");
    await expect(page).toHaveURL("/dashboard/expenses");
    await waitForText(page, TEST_EXPENSE_TITLE);
    await waitForText(page, TEST_EXPENSE_DESCRIPTION);
  });
});
