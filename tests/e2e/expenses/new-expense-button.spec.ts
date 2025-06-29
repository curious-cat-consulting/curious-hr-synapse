import { test, expect } from "@playwright/test";

test.describe("Expenses Page - New Expense Button", () => {
  test("New expense button opens drawer and form validation works", async ({ page }) => {
    // Navigate to expenses page
    await page.goto("/dashboard/expenses");
    await expect(page).toHaveURL("/dashboard/expenses", { timeout: 10000 });

    // Get the New Expense button from the page header
    const newExpenseButton = page.locator('[data-testid="new-expense-button"]').first();
    await expect(newExpenseButton).toBeVisible();
    await newExpenseButton.click();

    // Wait for drawer to open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2:has-text("New Expense Report")')).toBeVisible();

    // Fill only description (leave title empty)
    await page.fill('input[id="description"]', "Test description");

    // Try to submit - should not work due to required title field
    const createButton = page.locator('[data-testid="create-expense-button"]');
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Verify drawer is still open (form validation prevented submission)
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Now fill the title field
    await page.fill('input[id="title"]', "Test Expense Title");

    // Submit the form
    await createButton.click();

    // Wait for drawer to close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test("New expense button creates expense successfully", async ({ page }) => {
    // Generate unique data
    const uniqueTitle = `Test Expense ${Date.now()}`;
    const uniqueDescription = `Test Description ${Date.now()}`;

    // Navigate to expenses page
    await page.goto("/dashboard/expenses");
    await expect(page).toHaveURL("/dashboard/expenses", { timeout: 10000 });

    // Get the New Expense button from the page header
    const newExpenseButton = page.locator('[data-testid="new-expense-button"]').first();
    await expect(newExpenseButton).toBeVisible();
    await newExpenseButton.click();

    // Wait for drawer to open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2:has-text("New Expense Report")')).toBeVisible();

    // Fill the form
    await page.fill('input[id="title"]', uniqueTitle);
    await page.fill('input[id="description"]', uniqueDescription);

    // Submit the form using test ID
    const createButton = page.locator('[data-testid="create-expense-button"]');
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Wait for drawer to close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Wait a bit for the page to refresh
    await page.waitForTimeout(2000);

    // Verify the expense appears in the list
    await expect(page.locator(`text=${uniqueTitle}`)).toBeVisible();
    await expect(page.locator(`text=${uniqueDescription}`)).toBeVisible();
  });
});
