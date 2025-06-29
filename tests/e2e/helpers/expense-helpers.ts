import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { waitForText } from "./utility-helpers";

/**
 * Helper function to get the New Expense button from quick actions
 */
export function getQuickActionsNewExpenseButton(page: Page) {
  const quickActionsContainer = page.locator('[data-testid="quick-actions-new-expense"]');
  return quickActionsContainer.locator('[data-testid="new-expense-button"]');
}

/**
 * Helper function to get the New Expense button from expenses page header
 */
export function getExpensesPageNewExpenseButton(page: Page) {
  const expensesPageContainer = page.locator('[data-testid="expenses-page-new-expense"]');
  return expensesPageContainer.locator('[data-testid="new-expense-button"]');
}

/**
 * Helper function to create a new expense from quick actions on dashboard
 */
export async function createExpenseFromQuickActions(
  page: Page,
  title: string,
  description: string
): Promise<void> {
  // Click the New Expense button in quick actions using specific container
  const newExpenseButton = getQuickActionsNewExpenseButton(page);
  await expect(newExpenseButton).toBeVisible();
  await newExpenseButton.click();

  // Wait for drawer to open
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await expect(page.locator('h2:has-text("New Expense Report")')).toBeVisible();

  // Fill the form
  await page.fill('input[id="title"]', title);
  await page.fill('input[id="description"]', description);

  // Submit the form using test ID
  const createButton = page.locator('[data-testid="create-expense-button"]');
  await expect(createButton).toBeVisible();
  await createButton.click();

  // Wait for drawer to close
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();
}

/**
 * Helper function to verify expense was created successfully
 */
export async function verifyExpenseCreated(
  page: Page,
  title: string,
  description: string
): Promise<void> {
  await page.goto("/dashboard/expenses");
  await expect(page).toHaveURL("/dashboard/expenses", { timeout: 10000 });
  await waitForText(page, title);
  await waitForText(page, description);
}

/**
 * Helper function to test expense form validation
 */
export async function testExpenseFormValidation(
  page: Page,
  description: string,
  title: string
): Promise<void> {
  const newExpenseButton = getQuickActionsNewExpenseButton(page);
  await expect(newExpenseButton).toBeVisible();
  await newExpenseButton.click();

  // Wait for drawer to open
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await expect(page.locator('h2:has-text("New Expense Report")')).toBeVisible();

  // Fill only description (leave title empty)
  await page.fill('input[id="description"]', description);

  // Try to submit - should not work due to required title field
  const createButton = page.locator('[data-testid="create-expense-button"]');
  await expect(createButton).toBeVisible();
  await createButton.click();

  // Verify drawer is still open (form validation prevented submission)
  await expect(page.locator('[role="dialog"]')).toBeVisible();

  // Now create expense with valid data
  await page.fill('input[id="title"]', title);
  await createButton.click();

  // Verify drawer closes
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();
}
