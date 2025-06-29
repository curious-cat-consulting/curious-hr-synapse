/*
===============================================================================
                        SYNAPSE E2E TEST HELPERS
===============================================================================
Common helper functions for Synapse database tests to reduce boilerplate
and ensure consistent test setup patterns.
*/

-- Helper: Flexible cleanup function for specific test users
-- Now simplified since the database handles cascading deletes automatically
CREATE OR REPLACE FUNCTION public.cleanup_test_user_data(
  p_user_email text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
  username text;
BEGIN
  -- Determine which user to clean up
  IF p_user_id IS NOT NULL THEN
    target_user_id := p_user_id;
  ELSIF p_user_email IS NOT NULL THEN
    username := split_part(p_user_email, '@', 1);
    BEGIN
      SELECT tests.get_supabase_uid(username) INTO target_user_id;
    EXCEPTION WHEN OTHERS THEN
      -- User doesn't exist, nothing to clean up
      RETURN;
    END;
  ELSE
    -- No parameters provided, nothing to clean up
    RETURN;
  END IF;

  -- Clean up in dependency order (most dependent first)
  -- Note: The database now handles cascading deletes automatically via foreign key constraints
  
  -- 1. Clean up expenses (this will automatically delete all related data via CASCADE)
  DELETE FROM synapse.expenses WHERE user_id = target_user_id;
  
  -- 2. Clean up any team memberships first (this triggers notifications)
  DELETE FROM basejump.account_user WHERE user_id = target_user_id;
  
  -- 3. Clean up storage objects (not handled by CASCADE since it's in a different schema)
  -- Cast target_user_id to text since storage.objects.owner_id is text type
  DELETE FROM storage.objects WHERE bucket_id = 'receipts' AND owner_id = target_user_id::text;
  
  -- 4. Finally, clean up any personal account (if exists) - do this last to avoid FK violations
  DELETE FROM basejump.accounts WHERE primary_owner_user_id = target_user_id;
  
  -- 5. Finally, clean up the user from auth (if we have the username)
  IF p_user_email IS NOT NULL THEN
    username := split_part(p_user_email, '@', 1);
    BEGIN
      PERFORM tests.delete_supabase_user(username);
    EXCEPTION WHEN OTHERS THEN
      -- User might not exist in tests schema, that's okay
      NULL;
    END;
  END IF;
END;
$$;

-- Helper: Cleanup function for multiple test users
CREATE OR REPLACE FUNCTION public.cleanup_multiple_test_users(
  p_user_emails text[] DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  user_email text;
BEGIN
  -- If no emails provided, use default test users
  IF p_user_emails IS NULL THEN
    p_user_emails := ARRAY['test1@example.com', 'test2@example.com', 'user1@example.com', 'user2@example.com'];
  END IF;
  
  -- Clean up each user
  FOREACH user_email IN ARRAY p_user_emails
  LOOP
    PERFORM public.cleanup_test_user_data(user_email);
  END LOOP;
END;
$$;

-- Grant permissions for public functions
GRANT EXECUTE ON FUNCTION public.cleanup_test_user_data(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_multiple_test_users(text[]) TO authenticated;
