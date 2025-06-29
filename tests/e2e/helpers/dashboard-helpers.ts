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
