import type { FullConfig } from "@playwright/test";

import { cleanupOrphanedTestUsers } from "./helpers/test-utils";

/**
 * Global teardown that runs after all tests, even if they fail
 */
async function globalTeardown(_config: FullConfig) {
  // This runs after all tests, even if they fail or are interrupted
  console.log("Running global teardown to clean up any remaining test data...");

  // Clean up any orphaned test users that might have been left behind
  await cleanupOrphanedTestUsers();

  console.log("Global teardown completed");
}

export default globalTeardown;
