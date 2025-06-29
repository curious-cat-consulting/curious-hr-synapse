import { randomUUID } from "crypto";

import type { Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import { waitForLoginPage, signIn } from "./auth-helpers";
import { waitForDashboard } from "./dashboard-helpers";
import { waitForNetworkIdle } from "./utility-helpers";

// Supabase configuration for cleanup
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with service role key for cleanup operations
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

// Test configuration
const TEST_PASSWORD = "curious";

/**
 * Helper function to generate unique test email using GUID
 */
export function generateTestEmail(prefix: string = "test-user"): string {
  const guid = randomUUID();
  return `${prefix}-${guid}@curiouscat.consulting`;
}

/**
 * Helper function to create a test user via API
 */
export async function createTestUser(email: string): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true, // Auto-confirm email for testing
  });

  if (error != null) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }

  return data.user.id;
}

/**
 * Helper function to setup a test user and sign them in
 */
export async function setupTestUserAndSignIn(page: Page, email: string): Promise<string> {
  const userId = await createTestUser(email);

  await waitForLoginPage(page);
  await signIn(page, email);

  // Wait for authentication to complete
  await waitForNetworkIdle(page);

  await waitForDashboard(page);

  return userId;
}
