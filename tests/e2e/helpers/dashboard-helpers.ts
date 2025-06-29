import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Helper function to wait for and verify dashboard is loaded
 */
export async function waitForDashboard(page: Page): Promise<void> {
  await expect(page).toHaveURL("/dashboard");
  await expect(page.locator('h1:has-text("Personal Dashboard")')).toBeVisible();
}
