import { test } from "@playwright/test";

import {
  waitForLoginPage,
  signIn,
  waitForDashboard,
  generateTestEmail,
  waitForText,
  cleanupTestData,
  createTestUser,
  testLoginFormValidation,
} from "../helpers/test-utils";

test.describe("User Login", () => {
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

  test("Handle existing user login flow", async ({ page }) => {
    // First, create a user via API for this test
    testUserId = await createTestUser(testEmail);

    // Step 1: Navigate to login page
    await waitForLoginPage(page);

    // Step 2: Sign in with existing account
    await signIn(page, testEmail);

    // Step 3: Verify redirect to dashboard
    await waitForDashboard(page);
  });

  test("Handle invalid login credentials", async ({ page }) => {
    // Step 1: Navigate to login page
    await waitForLoginPage(page);

    // Step 2: Try to sign in with invalid credentials
    await signIn(page, "invalid@example.com");

    // Step 3: Verify error message is displayed
    await waitForText(page, "Could not authenticate user");
  });

  test("Form validation on login page", async ({ page }) => {
    // Step 1: Navigate to login page
    await waitForLoginPage(page);

    // Step 2: Test form validation
    await testLoginFormValidation(page, testEmail);
  });
});
