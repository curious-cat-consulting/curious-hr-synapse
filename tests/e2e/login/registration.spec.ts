import { test, expect } from "@playwright/test";

import {
  waitForLoginPage,
  signUp,
  waitForText,
  generateTestEmail,
  cleanupTestData,
} from "../helpers/test-utils";

test.use({ storageState: "./tests/e2e/no-state.json" });

test.describe("User Registration", () => {
  let testEmail: string;

  test.beforeEach(async () => {
    // Generate unique test email for each test run
    testEmail = generateTestEmail();
  });

  test.afterEach(async () => {
    // Cleanup test data
    await cleanupTestData(testEmail);
  });

  test("Complete user registration flow", async ({ page }) => {
    // Step 1: Navigate to login page
    await waitForLoginPage(page);

    // Step 2: Register new user
    await signUp(page, testEmail);

    // Step 3: Verify redirect to login with success message
    await expect(page).toHaveURL(/\/login/);
    await waitForText(page, "Check email to continue sign in process");
  });
});
