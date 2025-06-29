import { test } from "@playwright/test";

import {
  createExpenseFromQuickActions,
  verifyExpenseCreated,
  testExpenseFormValidation,
  waitForDashboard,
} from "../../helpers/test-utils";

// Helper function to generate a unique title and description
const generateUniqueExpenseData = () => {
  const guid = crypto.randomUUID();
  return {
    title: `Test Expense Report ${guid}`,
    description: `This is a test expense created by Playwright - ${guid}`,
  };
};

test.describe("Expense Creation", () => {
  test("Complete expense creation and verification flow", async ({ page }) => {
    const { title: uniqueTitle, description: uniqueDescription } = generateUniqueExpenseData();

    // Navigate to dashboard
    await waitForDashboard(page, true);

    // Create a new expense from quick actions
    await createExpenseFromQuickActions(page, uniqueTitle, uniqueDescription);

    // Verify the expense was created
    await verifyExpenseCreated(page, uniqueTitle, uniqueDescription);
  });

  test("Expense creation with validation", async ({ page }) => {
    const { title: uniqueTitle, description: uniqueDescription } = generateUniqueExpenseData();

    // Navigate to dashboard
    await waitForDashboard(page, true);

    // Test form validation and create expense
    await testExpenseFormValidation(page, uniqueDescription, uniqueTitle);

    // Verify expense was created
    await verifyExpenseCreated(page, uniqueTitle, uniqueDescription);
  });
});
