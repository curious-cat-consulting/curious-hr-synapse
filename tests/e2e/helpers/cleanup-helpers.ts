import { createClient } from "@supabase/supabase-js";

// Supabase configuration for cleanup
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with service role key for cleanup operations
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

/**
 * Helper function to clean up test data using public functions
 * Now simplified since the database handles cascading deletes automatically
 */
export async function cleanupTestData(testEmail: string, testUserId?: string): Promise<void> {
  try {
    // Call the public cleanup function
    // This will delete the user and all associated data will be cleaned up automatically
    // via CASCADE DELETE constraints
    const { error } = await supabase.rpc("cleanup_test_user_data", {
      p_user_email: testEmail,
      p_user_id: testUserId ?? null,
    });

    if (error != null) {
      console.error("Error during synapse cleanup:", error);
    } else {
      console.log(`Successfully cleaned up test data for: ${testEmail}`);
    }
  } catch (error) {
    console.error("Error during synapse test cleanup:", error);
  }
}

/**
 * Helper function to clean up orphaned test users using public functions
 * This can be called in global teardown to clean up any test users that weren't cleaned up properly
 */
export async function cleanupOrphanedTestUsers(): Promise<void> {
  try {
    // Call the public cleanup function for multiple users
    const { error } = await supabase.rpc("cleanup_multiple_test_users", {
      p_user_emails: null, // This will use the default test users
    });

    if (error != null) {
      console.error("Error during orphaned test user cleanup:", error);
    } else {
      console.log("Successfully cleaned up orphaned test users");
    }
  } catch (error) {
    console.error("Error during orphaned test user cleanup:", error);
  }
}
