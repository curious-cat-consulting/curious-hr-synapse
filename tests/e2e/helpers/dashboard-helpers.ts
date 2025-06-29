import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Helper function to wait for and verify dashboard is loaded
 * @param page - Playwright page object
 * @param shouldNavigate - If true, navigate to dashboard first. If false, just wait for dashboard to load.
 */
export async function waitForDashboard(page: Page, shouldNavigate: boolean = false): Promise<void> {
  if (shouldNavigate) {
    await page.goto("/dashboard");
  }

  await expect(page).toHaveURL("/dashboard", { timeout: 10000 });
  await expect(page.locator('h1:has-text("Personal Dashboard")')).toBeVisible();
}

/**
 * Helper function to navigate to and wait for team dashboard to load
 * @param page - Playwright page object
 * @param teamSlug - The team slug to navigate to (defaults to "test-team")
 */
export async function waitForTeamDashboard(
  page: Page,
  teamSlug: string = "test-team"
): Promise<void> {
  await page.goto(`/dashboard/${teamSlug}`);
  await expect(page).toHaveURL(`/dashboard/${teamSlug}`, { timeout: 10000 });
  await expect(page.locator('h1:has-text("Team Owner Dashboard")')).toBeVisible();
}
