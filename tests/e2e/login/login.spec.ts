import { test } from "@playwright/test";

import {
  waitForLoginPage,
  signIn,
  waitForDashboard,
  waitForText,
  testLoginFormValidation,
} from "../helpers/test-utils";

const TEST_EMAIL = "test@curiouscat.consulting";

test.use({ storageState: "./tests/e2e/no-state.json" });

test.describe("User Login", () => {
  test("Handle existing user login flow", async ({ page }) => {
    // Step 1: Navigate to login page
    await waitForLoginPage(page);

    // Step 2: Sign in with existing account
    await signIn(page, TEST_EMAIL);

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
    await testLoginFormValidation(page, TEST_EMAIL);
  });
});
