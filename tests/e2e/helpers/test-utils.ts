import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Supabase configuration for cleanup
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with service role key for cleanup operations
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

// Test configuration
const TEST_PASSWORD = "curious";

/**
 * Helper function to wait for and verify the login page is loaded
 */
export async function waitForLoginPage(page: Page): Promise<void> {
  await page.goto("/login");
  await expect(page).toHaveURL("/login");
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
}

/**
 * Helper function to fill login form
 */
export async function fillLoginForm(page: Page, email: string, password: string): Promise<void> {
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
}

/**
 * Helper function to sign in
 */
export async function signIn(page: Page, email: string): Promise<void> {
  await fillLoginForm(page, email, TEST_PASSWORD);
  const signInButton = page.locator('[data-testid="sign-in-button"]');
  await expect(signInButton).toBeVisible();
  await signInButton.click();
}

/**
 * Helper function to sign up
 */
export async function signUp(page: Page, email: string): Promise<void> {
  await fillLoginForm(page, email, TEST_PASSWORD);
  const signUpButton = page.locator('[data-testid="sign-up-button"]');
  await expect(signUpButton).toBeVisible();
  await signUpButton.click();
}

/**
 * Helper function to wait for and verify dashboard is loaded
 */
export async function waitForDashboard(page: Page): Promise<void> {
  await expect(page).toHaveURL("/dashboard");
  await expect(page.locator('h1:has-text("Personal Dashboard")')).toBeVisible();
}

/**
 * Helper function to create a new expense
 */
export async function createExpense(
  page: Page,
  title: string,
  description: string,
  buttonIndex: number = 0
): Promise<void> {
  // Click the New Expense button using test ID - target specific button by index
  const newExpenseButton = page.locator('[data-testid="new-expense-button"]').nth(buttonIndex);
  await expect(newExpenseButton).toBeVisible();
  await newExpenseButton.click();

  // Wait for drawer to open
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await expect(page.locator('h2:has-text("New Expense Report")')).toBeVisible();

  // Fill the form
  await page.fill('input[id="title"]', title);
  await page.fill('input[id="description"]', description);

  // Submit the form using test ID
  const createButton = page.locator('[data-testid="create-expense-button"]');
  await expect(createButton).toBeVisible();
  await createButton.click();

  // Wait for drawer to close
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();
}

/**
 * Helper function to get the New Expense button from quick actions
 */
export function getQuickActionsNewExpenseButton(page: Page) {
  const quickActionsContainer = page.locator('[data-testid="quick-actions-new-expense"]');
  return quickActionsContainer.locator('[data-testid="new-expense-button"]');
}

/**
 * Helper function to get the New Expense button from expenses page header
 */
export function getExpensesPageNewExpenseButton(page: Page) {
  const expensesPageContainer = page.locator('[data-testid="expenses-page-new-expense"]');
  return expensesPageContainer.locator('[data-testid="new-expense-button"]');
}

/**
 * Helper function to create a new expense from quick actions on dashboard
 */
export async function createExpenseFromQuickActions(
  page: Page,
  title: string,
  description: string
): Promise<void> {
  // Click the New Expense button in quick actions using specific container
  const newExpenseButton = getQuickActionsNewExpenseButton(page);
  await expect(newExpenseButton).toBeVisible();
  await newExpenseButton.click();

  // Wait for drawer to open
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await expect(page.locator('h2:has-text("New Expense Report")')).toBeVisible();

  // Fill the form
  await page.fill('input[id="title"]', title);
  await page.fill('input[id="description"]', description);

  // Submit the form using test ID
  const createButton = page.locator('[data-testid="create-expense-button"]');
  await expect(createButton).toBeVisible();
  await createButton.click();

  // Wait for drawer to close
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();
}

/**
 * Helper function to create a new expense from the expenses page header
 */
export async function createExpenseFromExpensesPage(
  page: Page,
  title: string,
  description: string
): Promise<void> {
  // Navigate to expenses page first
  await page.goto("/dashboard/expenses");
  await expect(page).toHaveURL("/dashboard/expenses");

  // Click the New Expense button in the expenses page header
  const newExpenseButton = getExpensesPageNewExpenseButton(page);
  await expect(newExpenseButton).toBeVisible();
  await newExpenseButton.click();

  // Wait for drawer to open
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await expect(page.locator('h2:has-text("New Expense Report")')).toBeVisible();

  // Fill the form
  await page.fill('input[id="title"]', title);
  await page.fill('input[id="description"]', description);

  // Submit the form using test ID
  const createButton = page.locator('[data-testid="create-expense-button"]');
  await expect(createButton).toBeVisible();
  await createButton.click();

  // Wait for drawer to close
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();
}

/**
 * Helper function to create a new expense from the dashboard quick actions
 */
export async function createExpenseFromDashboard(
  page: Page,
  title: string,
  description: string
): Promise<void> {
  // Navigate to dashboard first
  await page.goto("/dashboard");
  await expect(page).toHaveURL("/dashboard");

  // Use the quick actions function
  await createExpenseFromQuickActions(page, title, description);
}

/**
 * Helper function to add a line item to an expense
 */
export async function addLineItem(
  page: Page,
  description: string,
  category: string,
  amount: number
): Promise<void> {
  // Click the Add Line Item button using test ID
  const addLineItemButton = page.locator('[data-testid="add-line-item-button"]').first();
  await expect(addLineItemButton).toBeVisible();
  await addLineItemButton.click();

  // Wait for drawer to open
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await expect(page.locator('h2:has-text("Add Line Item")')).toBeVisible();

  // Fill the form
  await page.fill('input[id="description"]', description);
  await page.selectOption('select[id="category"]', category);
  await page.fill('input[id="unitPrice"]', amount.toString());

  // Submit the form using test ID
  const addButton = page.locator('[data-testid="add-line-item-submit-button"]');
  await expect(addButton).toBeVisible();
  await addButton.click();

  // Wait for drawer to close
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();
}

/**
 * Helper function to logout
 */
export async function logout(page: Page): Promise<void> {
  // Click the user account button using test ID
  const userAccountButton = page.locator('[data-testid="user-account-button"]');
  await expect(userAccountButton).toBeVisible();
  await userAccountButton.click();

  // Click the logout button using test ID
  const logoutButton = page.locator('[data-testid="logout-button"]');
  await expect(logoutButton).toBeVisible();
  await logoutButton.click();

  // Verify redirect to home page
  await expect(page).toHaveURL("/");
}

/**
 * Helper function to generate unique test email
 */
export function generateTestEmail(prefix: string = "test-user"): string {
  const timestamp = Date.now();
  return `${prefix}-${timestamp}@curious.consulting`;
}

/**
 * Helper function to wait for network idle
 */
export async function waitForNetworkIdle(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
}

/**
 * Helper function to wait for specific text to be visible
 */
export async function waitForText(page: Page, text: string): Promise<void> {
  await expect(page.locator(`text=${text}`)).toBeVisible();
}

/**
 * Helper function to create a test user via API
 */
export async function createTestUser(email: string): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true, // Auto-confirm email for testing
  });

  if (error != null) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }

  return data.user.id;
}

/**
 * Helper function to clean up test data using public functions
 * Now simplified since the database handles cascading deletes automatically
 */
export async function cleanupTestData(testEmail: string, testUserId?: string): Promise<void> {
  try {
    // Call the public cleanup function
    // This will delete the user and all associated data will be cleaned up automatically
    // via CASCADE DELETE constraints
    const { error } = await supabase.rpc("cleanup_test_user_data", {
      p_user_email: testEmail,
      p_user_id: testUserId ?? null,
    });

    if (error != null) {
      console.error("Error during synapse cleanup:", error);
    } else {
      console.log(`Successfully cleaned up test data for: ${testEmail}`);
    }
  } catch (error) {
    console.error("Error during synapse test cleanup:", error);
  }
}

/**
 * Helper function to clean up orphaned test users using public functions
 * This can be called in global teardown to clean up any test users that weren't cleaned up properly
 */
export async function cleanupOrphanedTestUsers(): Promise<void> {
  try {
    // Call the public cleanup function for multiple users
    const { error } = await supabase.rpc("cleanup_multiple_test_users", {
      p_user_emails: null, // This will use the default test users
    });

    if (error != null) {
      console.error("Error during orphaned test user cleanup:", error);
    } else {
      console.log("Successfully cleaned up orphaned test users");
    }
  } catch (error) {
    console.error("Error during orphaned test user cleanup:", error);
  }
}

/**
 * Helper function to setup a test user and sign them in
 */
export async function setupTestUserAndSignIn(page: Page, email: string): Promise<string> {
  const userId = await createTestUser(email);

  await waitForLoginPage(page);
  await signIn(page, email);

  // Wait for authentication to complete
  await waitForNetworkIdle(page);

  await waitForDashboard(page);

  return userId;
}

/**
 * Helper function to verify expense was created successfully
 */
export async function verifyExpenseCreated(
  page: Page,
  title: string,
  description: string
): Promise<void> {
  await page.goto("/dashboard/expenses");
  await expect(page).toHaveURL("/dashboard/expenses");
  await waitForText(page, title);
  await waitForText(page, description);
}

/**
 * Helper function to test expense form validation
 */
export async function testExpenseFormValidation(
  page: Page,
  description: string,
  title: string
): Promise<void> {
  const newExpenseButton = getQuickActionsNewExpenseButton(page);
  await expect(newExpenseButton).toBeVisible();
  await newExpenseButton.click();

  // Wait for drawer to open
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await expect(page.locator('h2:has-text("New Expense Report")')).toBeVisible();

  // Fill only description (leave title empty)
  await page.fill('input[id="description"]', description);

  // Try to submit - should not work due to required title field
  const createButton = page.locator('[data-testid="create-expense-button"]');
  await expect(createButton).toBeVisible();
  await createButton.click();

  // Verify drawer is still open (form validation prevented submission)
  await expect(page.locator('[role="dialog"]')).toBeVisible();

  // Now create expense with valid data
  await page.fill('input[id="title"]', title);
  await createButton.click();

  // Verify drawer closes
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();
}

/**
 * Helper function to test login form validation
 */
export async function testLoginFormValidation(page: Page, testEmail: string): Promise<void> {
  // Try to submit empty form
  const signInButton = page.locator('[data-testid="sign-in-button"]');
  await expect(signInButton).toBeVisible();
  await signInButton.click();

  // Verify form validation prevents submission
  // The form should have required attributes, so browser validation should prevent submission
  await expect(page).toHaveURL("/login");

  // Fill only email and try to submit
  await page.fill('input[name="email"]', testEmail);
  await signInButton.click();

  // Verify still on login page (password required)
  await expect(page).toHaveURL("/login");
}
