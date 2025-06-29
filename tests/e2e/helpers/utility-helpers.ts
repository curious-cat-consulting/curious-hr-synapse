import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Helper function to wait for network idle
 */
export async function waitForNetworkIdle(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
}

/**
 * Helper function to wait for specific text to be visible
 */
export async function waitForText(page: Page, text: string): Promise<void> {
  await expect(page.locator(`text=${text}`)).toBeVisible();
}
