import { test, expect } from "@playwright/test";

test.describe("Google OAuth", () => {
  test("should display Google OAuth button on login page", async ({ page }) => {
    await page.goto("/login");

    // Check that the Google OAuth button is present
    const googleButton = page.getByTestId("google-sign-in-button");
    await expect(googleButton).toBeVisible();

    // Check that the button has the correct text
    await expect(googleButton).toContainText("Continue with Google");

    // Check that the separator text is present
    await expect(page.getByText("Or continue with")).toBeVisible();
  });

  test("should handle returnUrl parameter in Google OAuth flow", async ({ page }) => {
    const returnUrl = "/dashboard/settings";
    await page.goto(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);

    // Check that the Google OAuth button is present
    const googleButton = page.getByTestId("google-sign-in-button");
    await expect(googleButton).toBeVisible();

    // Note: We can't test the actual OAuth flow in E2E tests without setting up
    // Google OAuth credentials, but we can verify the button is present and clickable
    await expect(googleButton).toBeEnabled();
  });
});
