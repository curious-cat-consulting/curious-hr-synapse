import { test, expect } from "@playwright/test";

test.describe("Expenses Page - Basic Functionality", () => {
  test("Expenses page loads correctly", async ({ page }) => {
    // Navigate to expenses page
    await page.goto("/dashboard/expenses");
    await expect(page).toHaveURL("/dashboard/expenses", { timeout: 10000 });

    // Wait for the page to load
    await expect(page.locator('h1:has-text("Expenses")')).toBeVisible();

    // Check that new expense button is visible
    const newExpenseButton = page.locator('[data-testid="new-expense-button"]').first();
    await expect(newExpenseButton).toBeVisible();

    // Check that the button text is correct
    await expect(newExpenseButton).toContainText("New Expense");
  });

  test("New expense button opens drawer", async ({ page }) => {
    // Navigate to expenses page
    await page.goto("/dashboard/expenses");
    await expect(page).toHaveURL("/dashboard/expenses", { timeout: 10000 });

    // Wait for the page to load
    await expect(page.locator('h1:has-text("Expenses")')).toBeVisible();

    // Click the new expense button
    const newExpenseButton = page.locator('[data-testid="new-expense-button"]').first();
    await expect(newExpenseButton).toBeVisible();
    await newExpenseButton.click();

    // Verify drawer opens
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2:has-text("New Expense Report")')).toBeVisible();

    // Close the drawer
    await page.keyboard.press("Escape");
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test("Expenses page shows filters", async ({ page }) => {
    // Navigate to expenses page
    await page.goto("/dashboard/expenses");
    await expect(page).toHaveURL("/dashboard/expenses", { timeout: 10000 });

    // Wait for the page to load
    await expect(page.locator('h1:has-text("Expenses")')).toBeVisible();

    // Wait a bit for the filters to load
    await page.waitForTimeout(2000);

    // Check that status filter is visible
    await expect(page.locator('label:has-text("Status Filter")')).toBeVisible();

    // Check that sort control is visible
    await expect(page.locator('label:has-text("Sort")')).toBeVisible();
  });
});
