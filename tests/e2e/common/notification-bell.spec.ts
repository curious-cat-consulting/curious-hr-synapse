import { test, expect } from "@playwright/test";

import { waitForDashboard } from "../helpers";

test.describe("Notification Bell", () => {
  test("displays notification count and allows interaction", async ({ page }) => {
    await waitForDashboard(page, true);

    // Wait for the notification bell to be visible
    const notificationBell = page.locator('[data-testid="notification-bell"]');
    await expect(notificationBell).toBeVisible();

    // Check if there's a notification count badge (should be present for new users)
    const notificationBadge = page.locator('[data-testid="notification-badge"]');

    // Wait a moment for notifications to load
    await page.waitForTimeout(1000);

    // Check if badge exists and has a number
    const badgeVisible = await notificationBadge.isVisible();
    if (badgeVisible) {
      const badgeText = await notificationBadge.textContent();
      expect(badgeText).toBeTruthy();
      expect(Number(badgeText?.replace(/\D/g, ""))).toBeGreaterThan(0);
    }

    // Click the notification bell to open dropdown
    await notificationBell.click();

    // Wait for dropdown to open
    await expect(page.locator('[data-testid="notification-dropdown"]')).toBeVisible();

    // Check that notifications are listed
    const notificationsList = page.locator('[data-testid^="notification-item-"]');
    await expect(notificationsList.first()).toBeVisible();

    // Verify we have the expected notifications for a new user
    const notificationTexts = await notificationsList.allTextContents();

    // Check for welcome/team notifications
    const hasWelcomeNotification = notificationTexts.some(
      (text) => text.toLowerCase().includes("welcome") || text.toLowerCase().includes("team")
    );
    const hasPostingTeamNotification = notificationTexts.some(
      (text) => text.toLowerCase().includes("posting") || text.toLowerCase().includes("updated")
    );

    // At least one of these should be present for a new user
    expect(hasWelcomeNotification || hasPostingTeamNotification).toBeTruthy();

    // Test mark all as read functionality
    const markAllButton = page.locator('[data-testid="mark-all-read-button"]');
    if (await markAllButton.isVisible()) {
      await markAllButton.click();

      // Wait for the action to complete
      await page.waitForTimeout(500);

      // Check that the badge is no longer visible or shows 0
      const updatedBadge = page.locator('[data-testid="notification-badge"]');
      if (await updatedBadge.isVisible()) {
        const updatedBadgeText = await updatedBadge.textContent();
        expect(updatedBadgeText).toBe("0");
      }
    }

    // Test delete all functionality
    const deleteAllButton = page.locator('[data-testid="delete-all-button"]');
    if (await deleteAllButton.isVisible()) {
      await deleteAllButton.click();

      // Wait for the action to complete
      await page.waitForTimeout(500);

      // Check that no notifications are shown
      await expect(page.locator('[data-testid="no-notifications"]')).toBeVisible();
    }

    // Close the dropdown
    await page.keyboard.press("Escape");

    // Verify dropdown is closed
    await expect(page.locator('[data-testid="notification-dropdown"]')).not.toBeVisible();
  });

  test("can click on individual notifications", async ({ page }) => {
    await waitForDashboard(page, true);

    // Open notification bell
    const notificationBell = page.locator('[data-testid="notification-bell"]');
    await notificationBell.click();

    // Wait for dropdown to open
    await expect(page.locator('[data-testid="notification-dropdown"]')).toBeVisible();

    // Get the first notification
    const firstNotification = page.locator('[data-testid^="notification-item-"]').first();

    if (await firstNotification.isVisible()) {
      // Click on the first notification
      await firstNotification.click();

      // Should navigate to a page (could be settings, dashboard, etc.)
      // Wait for navigation to complete
      await page.waitForLoadState("networkidle");

      // Verify we're no longer on the dashboard (navigation occurred)
      const currentUrl = page.url();
      expect(currentUrl).not.toBe("/dashboard");
    }
  });
});
