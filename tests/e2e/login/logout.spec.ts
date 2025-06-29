import { test } from "@playwright/test";

import {
  setupTestUserAndSignIn,
  logout,
  waitForLoginPage,
  generateTestEmail,
  cleanupTestData,
} from "../helpers/test-utils";

test.describe("User Logout", () => {
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

  test("Complete logout flow", async ({ page }) => {
    // Setup test user and sign in
    testUserId = await setupTestUserAndSignIn(page, testEmail);

    // Perform logout
    await logout(page);

    // Verify user is redirected to home page and can access login page
    await waitForLoginPage(page);
  });
});
