import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

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
