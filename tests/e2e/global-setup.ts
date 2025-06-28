import type { FullConfig } from "@playwright/test";

/**
 * Global setup that runs before all tests
 */
async function globalSetup(_config: FullConfig) {
  // This runs before all tests
  console.log("Global setup completed");
}

export default globalSetup;
