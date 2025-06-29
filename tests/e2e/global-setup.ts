import type { FullConfig } from "@playwright/test";
import { chromium } from "@playwright/test";

import { waitForLoginPage, signIn } from "./helpers/auth-helpers";
import { waitForDashboard } from "./helpers/dashboard-helpers";
import { waitForNetworkIdle } from "./helpers/utility-helpers";

// Test configuration - using pre-created user
const TEST_EMAIL = "test@curiouscat.consulting";

/**
 * Global setup that runs before all tests
 */
async function globalSetup(_config: FullConfig) {
  console.log(`Using pre-created test user: ${TEST_EMAIL}`);

  // Get base URL from config or use default
  const baseURL = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

  // Launch browser and perform login
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  try {
    // Use existing login helpers
    await waitForLoginPage(page);
    await signIn(page, TEST_EMAIL);

    // Wait for authentication to complete
    await waitForNetworkIdle(page);
    await waitForDashboard(page);

    // Save storage state
    await context.storageState({ path: "./tests/e2e/storage-state.json" });
    console.log("Authentication state saved to storage-state.json");
  } catch (error) {
    console.error("Error during login setup:", error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log("Global setup completed");
}

export default globalSetup;
