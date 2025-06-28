import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Supabase configuration for cleanup
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with service role key for cleanup operations
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

/**
 * Helper function to wait for and verify the login page is loaded
 */
export async function waitForLoginPage(page: Page): Promise<void> {
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
export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await fillLoginForm(page, email, password);
  const signInButton = page.locator('[data-testid="sign-in-button"]');
  await expect(signInButton).toBeVisible();
  await signInButton.click();
}

/**
 * Helper function to sign up
 */
export async function signUp(page: Page, email: string, password: string): Promise<void> {
  await fillLoginForm(page, email, password);
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
 * Helper function to find a user by email
 */
export async function findUserByEmail(email: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error != null) {
      console.error("Error listing users:", error);
      return null;
    }

    const user = data.users.find((u) => u.email === email);
    return user?.id ?? null;
  } catch (error) {
    console.error("Error finding user by email:", error);
    return null;
  }
}

/**
 * Helper function to delete a user by ID
 */
export async function deleteUserById(userId: string): Promise<void> {
  try {
    // First, try to delete any expenses created by the user (if table exists)
    try {
      const { error: expensesError } = await supabase
        .from("expenses")
        .delete()
        .eq("created_by", userId);

      if (expensesError != null) {
        console.error("Error cleaning up expenses:", expensesError);
      }
    } catch {
      // Table might not exist, which is fine
      console.log("Expenses table not available for cleanup");
    }

    // Try to delete any personal accounts associated with the user (if table exists)
    try {
      const { error: accountsError } = await supabase
        .from("accounts")
        .delete()
        .eq("owner_id", userId);

      if (accountsError != null) {
        console.error("Error cleaning up accounts:", accountsError);
      }
    } catch {
      // Table might not exist, which is fine
      console.log("Accounts table not available for cleanup");
    }

    // Delete the user from auth.users
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError != null) {
      console.error("Error deleting user:", authError);
    } else {
      console.log(`Successfully deleted user: ${userId}`);
    }
  } catch (error) {
    console.error("Error during user deletion:", error);
  }
}

/**
 * Helper function to delete a user by email
 */
export async function deleteUserByEmail(email: string): Promise<void> {
  const userId = await findUserByEmail(email);
  if (userId != null) {
    await deleteUserById(userId);
  }
}

/**
 * Comprehensive cleanup function that handles all test data
 */
export async function cleanupTestData(testEmail: string, testUserId?: string): Promise<void> {
  try {
    // If we have a user ID, use it for cleanup
    if (testUserId != null) {
      await deleteUserById(testUserId);
    }

    // Also try to find and delete by email (in case user was created via signup)
    await deleteUserByEmail(testEmail);
  } catch (error) {
    console.error("Error during comprehensive test cleanup:", error);
  }
}

/**
 * Helper function to create a test user via API
 */
export async function createTestUser(email: string, password: string): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email for testing
  });

  if (error != null) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }

  return data.user.id;
}

/**
 * Helper function to clean up orphaned test users
 * This can be called in global teardown to clean up any test users that weren't cleaned up properly
 */
export async function cleanupOrphanedTestUsers(): Promise<void> {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error != null) {
      console.error("Error listing users for orphan cleanup:", error);
      return;
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    const testUsers = data.users.filter((user) => {
      // Look for test users created in the last hour with our test email pattern
      const isTestEmail = user.email?.includes("@curious.consulting") ?? false;
      const isRecent = new Date(user.created_at) > oneHourAgo;
      return isTestEmail && isRecent;
    });

    console.log(`Found ${testUsers.length} orphaned test users to clean up`);

    for (const user of testUsers) {
      await deleteUserById(user.id);
      console.log(`Cleaned up orphaned test user: ${user.email}`);
    }
  } catch (error) {
    console.error("Error during orphaned test user cleanup:", error);
  }
}
