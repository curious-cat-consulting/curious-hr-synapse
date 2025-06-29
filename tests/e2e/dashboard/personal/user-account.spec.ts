import { test, expect } from "@playwright/test";

import { waitForDashboard } from "../../helpers/test-utils";

test.describe("User Account Dropdown", () => {
  test("My Account navigation works", async ({ page }) => {
    await waitForDashboard(page, true);

    // Open user account dropdown
    const userAccountButton = page.locator('[data-testid="user-account-button"]');
    await expect(userAccountButton).toBeVisible();
    await userAccountButton.click();

    // Test "My Account" link
    const myAccountLink = page.locator('[data-testid="my-account-link"]');
    await expect(myAccountLink).toBeVisible();
    await myAccountLink.click();

    // Verify navigation to dashboard home
    await expect(page).toHaveURL("/dashboard");
  });

  test("Settings navigation works", async ({ page }) => {
    await waitForDashboard(page, true);

    // Open user account dropdown
    const userAccountButton = page.locator('[data-testid="user-account-button"]');
    await expect(userAccountButton).toBeVisible();
    await userAccountButton.click();

    // Test "Settings" link
    const settingsLink = page.locator('[data-testid="settings-link"]');
    await expect(settingsLink).toBeVisible();
    await settingsLink.click();

    // Verify navigation to settings page
    await expect(page).toHaveURL("/dashboard/settings");
  });

  test("Teams navigation works", async ({ page }) => {
    await waitForDashboard(page, true);

    // Open user account dropdown
    const userAccountButton = page.locator('[data-testid="user-account-button"]');
    await expect(userAccountButton).toBeVisible();
    await userAccountButton.click();

    // Test "Teams" link
    const teamsLink = page.locator('[data-testid="teams-link"]');
    await expect(teamsLink).toBeVisible();
    await teamsLink.click();

    // Verify navigation to teams settings page
    await expect(page).toHaveURL("/dashboard/settings/teams");
  });
});
