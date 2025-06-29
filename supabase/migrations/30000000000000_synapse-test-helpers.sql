/*
===============================================================================
                        SYNAPSE TEST HELPERS
===============================================================================
Common helper functions for Synapse database tests to reduce boilerplate
and ensure consistent test setup patterns.
*/

-- Create synapse_tests schema for custom helpers
CREATE SCHEMA IF NOT EXISTS synapse_tests;

-- Helper 1: Create a random expense with realistic data
CREATE OR REPLACE FUNCTION synapse_tests.create_random_expense(
  p_user_email text DEFAULT 'test@example.com',
  p_title text DEFAULT NULL,
  p_description text DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  user_id uuid;
  expense_result json;
  username text;
  random_titles text[] := ARRAY[
    'Office Supplies Purchase',
    'Client Lunch Meeting',
    'Conference Registration',
    'Travel Expenses',
    'Software Subscription',
    'Marketing Materials',
    'Equipment Rental',
    'Professional Development'
  ];
  random_descriptions text[] := ARRAY[
    'Monthly office supplies for team',
    'Business lunch with potential client',
    'Annual industry conference attendance',
    'Round trip flight and hotel accommodation',
    'Monthly SaaS tool subscription',
    'Promotional materials for trade show',
    'Audio/visual equipment for presentation',
    'Online course and certification fees'
  ];
BEGIN
  -- Extract username from email
  username := split_part(p_user_email, '@', 1);
  
  -- Check if user exists, create only if needed
  BEGIN
    SELECT tests.get_supabase_uid(username) INTO user_id;
  EXCEPTION WHEN OTHERS THEN
    -- User doesn't exist, create them
    PERFORM tests.create_supabase_user(username, p_user_email);
    SELECT tests.get_supabase_uid(username) INTO user_id;
  END;
  
  -- Authenticate as the user
  PERFORM tests.authenticate_as(username);
  
  -- Use provided title/description or generate random ones
  SELECT public.create_expense(
    COALESCE(p_title, random_titles[floor(random() * array_length(random_titles, 1) + 1)]),
    user_id,
    COALESCE(p_description, random_descriptions[floor(random() * array_length(random_descriptions, 1) + 1)])
  ) INTO expense_result;
  
  RETURN expense_result;
END;
$$;

-- Helper 2: Create expense with receipt metadata and storage objects
CREATE OR REPLACE FUNCTION synapse_tests.create_expense_with_receipt_metadata(
  p_user_email text DEFAULT 'test@example.com',
  p_expense_title text DEFAULT 'Test Expense with Receipt',
  p_vendor_name text DEFAULT 'Test Vendor',
  p_receipt_total decimal DEFAULT 100.00,
  p_receipt_filename text DEFAULT 'test-receipt.png'
) RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  user_id uuid;
  username text;
  expense_result json;
  v_expense_id uuid;
  receipt_obj_id uuid;
  storage_name text;
BEGIN
  -- Extract username from email
  username := split_part(p_user_email, '@', 1);
  
  -- Check if user exists, create only if needed
  BEGIN
    SELECT tests.get_supabase_uid(username) INTO user_id;
  EXCEPTION WHEN OTHERS THEN
    -- User doesn't exist, create them
    PERFORM tests.create_supabase_user(username, p_user_email);
    SELECT tests.get_supabase_uid(username) INTO user_id;
  END;
  
  -- Authenticate as the user
  PERFORM tests.authenticate_as(username);
  
  -- Create expense
  SELECT public.create_expense(p_expense_title, user_id, 'Expense with receipt metadata') 
  INTO expense_result;
  v_expense_id := (expense_result->>'id')::uuid;
  
  -- Create storage object for receipt
  storage_name := concat(user_id, '/', v_expense_id, '/', p_receipt_filename);
  INSERT INTO storage.objects (bucket_id, name, owner_id)
  VALUES ('receipts', storage_name, user_id)
  RETURNING id INTO receipt_obj_id;
  
  -- Create receipt metadata
  INSERT INTO synapse.receipt_metadata (
    expense_id, 
    receipt_id, 
    vendor_name, 
    receipt_date, 
    receipt_total, 
    confidence_score, 
    currency_code
  )
  VALUES (
    v_expense_id,
    receipt_obj_id,
    p_vendor_name,
    CURRENT_DATE - (random() * 30)::int,  -- Random date within last 30 days
    p_receipt_total,
    0.85 + (random() * 0.15),  -- Random confidence between 0.85 and 1.0
    'USD'
  );
  
  -- Return enhanced expense result with receipt info
  RETURN json_build_object(
    'expense', expense_result,
    'receipt_id', receipt_obj_id,
    'storage_name', storage_name,
    'vendor_name', p_vendor_name,
    'receipt_total', p_receipt_total
  );
END;
$$;

-- Helper 3: Create expense with line items (common 2-3 dependency setup)
CREATE OR REPLACE FUNCTION synapse_tests.create_expense_with_line_items(
  p_user_email text DEFAULT 'test@example.com',
  p_expense_title text DEFAULT 'Test Expense with Line Items',
  p_line_items jsonb DEFAULT '[
    {"description": "Office Supplies", "quantity": 2, "unit_price": 25.00, "category": "Office"},
    {"description": "Coffee", "quantity": 1, "unit_price": 5.00, "category": "Meals"},
    {"description": "Taxi Fare", "quantity": 1, "unit_price": 15.50, "category": "Transportation"}
  ]'::jsonb
) RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  user_id uuid;
  username text;
  expense_result json;
  v_expense_id uuid;
  receipt_obj_id uuid;
  storage_name text;
  line_item jsonb;
  line_item_ids uuid[] := '{}';
  total_amount decimal := 0;
BEGIN
  -- Extract username from email
  username := split_part(p_user_email, '@', 1);
  
  -- Check if user exists, create only if needed
  BEGIN
    SELECT tests.get_supabase_uid(username) INTO user_id;
  EXCEPTION WHEN OTHERS THEN
    -- User doesn't exist, create them
    PERFORM tests.create_supabase_user(username, p_user_email);
    SELECT tests.get_supabase_uid(username) INTO user_id;
  END;
  
  -- Authenticate as the user
  PERFORM tests.authenticate_as(username);
  
  -- Create expense
  SELECT public.create_expense(p_expense_title, user_id, 'Expense with line items') 
  INTO expense_result;
  v_expense_id := (expense_result->>'id')::uuid;
  
  -- Create storage object for receipt
  storage_name := concat(user_id, '/', v_expense_id, '/receipt-with-items.png');
  INSERT INTO storage.objects (bucket_id, name, owner_id)
  VALUES ('receipts', storage_name, user_id)
  RETURNING id INTO receipt_obj_id;
  
  -- Create receipt metadata first
  INSERT INTO synapse.receipt_metadata (
    expense_id, 
    receipt_id, 
    vendor_name, 
    receipt_date, 
    receipt_total, 
    confidence_score, 
    currency_code
  )
  VALUES (
    v_expense_id,
    receipt_obj_id,
    'Multi-Item Vendor',
    CURRENT_DATE,
    0, -- Will be updated after calculating line items
    0.90,
    'USD'
  );
  
  -- Create line items
  FOR line_item IN SELECT * FROM jsonb_array_elements(p_line_items)
  LOOP
    INSERT INTO synapse.receipt_line_items (
      expense_id,
      receipt_id,
      description,
      quantity,
      unit_price,
      total_amount,
      category,
      is_ai_generated,
      line_item_date
    )
    VALUES (
      v_expense_id,
      receipt_obj_id,
      line_item->>'description',
      (line_item->>'quantity')::decimal,
      (line_item->>'unit_price')::decimal,
      (line_item->>'quantity')::decimal * (line_item->>'unit_price')::decimal,
      line_item->>'category',
      false,
      CURRENT_DATE
    );
    
    -- Add to total
    total_amount := total_amount + ((line_item->>'quantity')::decimal * (line_item->>'unit_price')::decimal);
  END LOOP;
  
  -- Update receipt metadata with correct total
  UPDATE synapse.receipt_metadata rm
  SET receipt_total = total_amount
  WHERE rm.expense_id = v_expense_id AND rm.receipt_id = receipt_obj_id;
  
  -- Return comprehensive result
  RETURN json_build_object(
    'expense', expense_result,
    'receipt_id', receipt_obj_id,
    'storage_name', storage_name,
    'total_amount', total_amount,
    'line_item_count', jsonb_array_length(p_line_items)
  );
END;
$$;

-- Helper 4: Setup multi-user scenario with cross-user access testing
CREATE OR REPLACE FUNCTION synapse_tests.setup_multi_user_scenario()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  user1_expense json;
  user2_expense json;
  result json;
BEGIN
  -- Create two users with expenses
  SELECT synapse_tests.create_random_expense('user1@test.com', 'User 1 Expense') INTO user1_expense;
  SELECT synapse_tests.create_random_expense('user2@test.com', 'User 2 Expense') INTO user2_expense;
  
  -- Store IDs for cross-reference testing
  PERFORM set_config('test.user1_expense_id', (user1_expense->>'id'), false);
  PERFORM set_config('test.user2_expense_id', (user2_expense->>'id'), false);
  PERFORM set_config('test.user1_id', tests.get_supabase_uid('user1')::text, false);
  PERFORM set_config('test.user2_id', tests.get_supabase_uid('user2')::text, false);
  
  RETURN json_build_object(
    'user1', json_build_object(
      'username', 'user1',
      'user_id', tests.get_supabase_uid('user1'),
      'expense', user1_expense
    ),
    'user2', json_build_object(
      'username', 'user2', 
      'user_id', tests.get_supabase_uid('user2'),
      'expense', user2_expense
    )
  );
END;
$$;

-- Helper 5: Create storage bucket and objects for testing (handles dependencies)
CREATE OR REPLACE FUNCTION synapse_tests.setup_storage_dependencies(
  p_bucket_name text DEFAULT 'test-bucket',
  p_owner_id uuid DEFAULT 'dddddddd-dddd-dddd-dddd-dddddddddddd'
) RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  bucket_id text;
  object_id uuid;
BEGIN
  -- Create bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, owner, created_at, updated_at)
  VALUES (p_bucket_name, p_bucket_name, p_owner_id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  
  -- Create a test object
  INSERT INTO storage.objects (id, bucket_id, name, owner_id, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    p_bucket_name,
    'test-object-' || extract(epoch from now()),
    p_owner_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO object_id;
  
  -- Store for easy access in tests
  PERFORM set_config('test.bucket_id', p_bucket_name, false);
  PERFORM set_config('test.object_id', object_id::text, false);
  
  RETURN json_build_object(
    'bucket_id', p_bucket_name,
    'object_id', object_id,
    'owner_id', p_owner_id
  );
END;
$$;

-- Helper 6: Clean up test data (for use in teardown)
CREATE OR REPLACE FUNCTION synapse_tests.cleanup_synapse_test_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Clean up in dependency order
  DELETE FROM synapse.receipt_line_items WHERE expense_id IN (
    SELECT id FROM synapse.expenses WHERE user_id IN (
      SELECT tests.get_supabase_uid(username) 
      FROM unnest(ARRAY['test1', 'test2', 'user1', 'user2']) AS username
    )
  );
  
  DELETE FROM synapse.mileage_line_items WHERE expense_id IN (
    SELECT id FROM synapse.expenses WHERE user_id IN (
      SELECT tests.get_supabase_uid(username) 
      FROM unnest(ARRAY['test1', 'test2', 'user1', 'user2']) AS username
    )
  );
  
  DELETE FROM synapse.receipt_metadata WHERE expense_id IN (
    SELECT id FROM synapse.expenses WHERE user_id IN (
      SELECT tests.get_supabase_uid(username) 
      FROM unnest(ARRAY['test1', 'test2', 'user1', 'user2']) AS username
    )
  );
  
  DELETE FROM synapse.expenses WHERE user_id IN (
    SELECT tests.get_supabase_uid(username) 
    FROM unnest(ARRAY['test1', 'test2', 'user1', 'user2']) AS username
  );
  
  -- Clean up storage objects for test users
  DELETE FROM storage.objects WHERE bucket_id = 'receipts' AND owner_id IN (
    SELECT tests.get_supabase_uid(username) 
    FROM unnest(ARRAY['test1', 'test2', 'user1', 'user2']) AS username
  );
  
  -- Clean up test buckets
  DELETE FROM storage.objects WHERE bucket_id LIKE 'test-%';
  DELETE FROM storage.buckets WHERE id LIKE 'test-%';
END;
$$;

-- Helper 7: Assert expense amount equals expected (common verification pattern)
CREATE OR REPLACE FUNCTION synapse_tests.assert_expense_amount(
  p_expense_id uuid,
  p_expected_amount decimal,
  p_test_description text DEFAULT 'Expense amount should match expected value'
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  actual_amount decimal;
BEGIN
  SELECT amount INTO actual_amount 
  FROM synapse.expenses 
  WHERE id = p_expense_id;
  
  PERFORM results_eq(
    format('SELECT amount FROM synapse.expenses WHERE id = %L', p_expense_id),
    ARRAY[p_expected_amount],
    p_test_description
  );
END;
$$;

-- Helper 8: Create expense with mileage line items
CREATE OR REPLACE FUNCTION synapse_tests.create_expense_with_mileage(
  p_user_email text DEFAULT 'test@example.com',
  p_expense_title text DEFAULT 'Test Mileage Expense',
  p_miles decimal DEFAULT 50.0,
  p_rate_per_mile decimal DEFAULT 0.67
) RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  user_id uuid;
  username text;
  expense_result json;
  v_expense_id uuid;
  mileage_total decimal;
BEGIN
  -- Extract username and setup user
  username := split_part(p_user_email, '@', 1);
  PERFORM tests.create_supabase_user(username, p_user_email);
  SELECT tests.get_supabase_uid(username) INTO user_id;
  PERFORM tests.authenticate_as(username);
  
  -- Create expense
  SELECT public.create_expense(p_expense_title, user_id, 'Mileage expense') 
  INTO expense_result;
  v_expense_id := (expense_result->>'id')::uuid;
  
  -- Calculate mileage total
  mileage_total := p_miles * p_rate_per_mile;
  
  -- Create mileage line item
  INSERT INTO synapse.mileage_line_items (
    expense_id,
    description,
    miles,
    rate_per_mile,
    total_amount,
    trip_date,
    from_location,
    to_location,
    business_purpose
  )
  VALUES (
    v_expense_id,
    format('Business trip - %.1f miles', p_miles),
    p_miles,
    p_rate_per_mile,
    mileage_total,
    CURRENT_DATE,
    'Office',
    'Client Site',
    'Client meeting and project review'
  );
  
  RETURN json_build_object(
    'expense', expense_result,
    'miles', p_miles,
    'rate_per_mile', p_rate_per_mile,
    'mileage_total', mileage_total
  );
END;
$$;

-- Helper: Create line item with validation testing
CREATE OR REPLACE FUNCTION synapse_tests.create_line_item_for_testing(
  p_expense_id uuid,
  p_receipt_id uuid,
  p_description text DEFAULT 'Test Line Item',
  p_quantity decimal DEFAULT 1,
  p_unit_price decimal DEFAULT 25.00,
  p_category text DEFAULT 'Office Supplies',
  p_is_ai_generated boolean DEFAULT false
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  line_item_id uuid;
  total_amount decimal;
BEGIN
  total_amount := p_quantity * p_unit_price;
  
  INSERT INTO synapse.receipt_line_items (
    expense_id,
    receipt_id,
    description,
    quantity,
    unit_price,
    total_amount,
    category,
    is_ai_generated,
    line_item_date
  )
  VALUES (
    p_expense_id,
    p_receipt_id,
    p_description,
    p_quantity,
    p_unit_price,
    total_amount,
    p_category,
    p_is_ai_generated,
    CURRENT_DATE
  )
  RETURNING id INTO line_item_id;
  
  RETURN line_item_id;
END;
$$;

-- Helper: Test line item permissions across users
CREATE OR REPLACE FUNCTION synapse_tests.test_line_item_cross_user_access(
  p_user1_expense_id uuid,
  p_user1_receipt_id uuid
) RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  user2_line_item_id uuid;
  result json;
BEGIN
  -- Try to create line item for user1's expense while authenticated as user2
  BEGIN
    INSERT INTO synapse.receipt_line_items (expense_id, receipt_id, description, total_amount)
    VALUES (p_user1_expense_id, p_user1_receipt_id, 'Unauthorized Item', 50.00)
    RETURNING id INTO user2_line_item_id;
    
    -- If we get here, security failed
    result := json_build_object('success', false, 'error', 'Security breach: cross-user insert succeeded');
  EXCEPTION WHEN OTHERS THEN
    -- This is expected - security worked
    result := json_build_object('success', true, 'message', 'Cross-user access properly denied');
  END;
  
  RETURN result;
END;
$$;

-- Helper: Create expense with mixed AI/manual line items for testing
CREATE OR REPLACE FUNCTION synapse_tests.create_expense_with_mixed_line_items(
  p_user_email text DEFAULT 'test@example.com',
  p_expense_title text DEFAULT 'Mixed Line Items Test'
) RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  username text;
  expense_result json;
  v_expense_id uuid;
  receipt_obj_id uuid;
  ai_line_item_id uuid;
  manual_line_item_id uuid;
BEGIN
  -- Create expense with receipt metadata
  SELECT synapse_tests.create_expense_with_receipt_metadata(
    p_user_email,
    p_expense_title,
    'Mixed Items Vendor',
    150.00
  ) INTO expense_result;
  
  v_expense_id := (expense_result->'expense'->>'id')::uuid;
  receipt_obj_id := (expense_result->>'receipt_id')::uuid;
  
  -- Authenticate as user
  username := split_part(p_user_email, '@', 1);
  PERFORM tests.authenticate_as(username);
  
  -- Create AI-generated line item
  SELECT synapse_tests.create_line_item_for_testing(
    v_expense_id,
    receipt_obj_id,
    'AI Generated Item',
    2,
    40.00,
    'Office Supplies',
    true
  ) INTO ai_line_item_id;
  
  -- Create manual line item
  SELECT synapse_tests.create_line_item_for_testing(
    v_expense_id,
    receipt_obj_id,
    'Manual Item',
    1,
    70.00,
    'Meals',
    false
  ) INTO manual_line_item_id;
  
  RETURN json_build_object(
    'expense', expense_result->'expense',
    'receipt_id', receipt_obj_id,
    'ai_line_item_id', ai_line_item_id,
    'manual_line_item_id', manual_line_item_id,
    'total_amount', 150.00
  );
END;
$$;

-- Helper: Assert line item counts and types
CREATE OR REPLACE FUNCTION synapse_tests.assert_line_item_counts(
  p_expense_id uuid,
  p_expected_total integer,
  p_expected_ai integer DEFAULT NULL,
  p_expected_manual integer DEFAULT NULL,
  p_test_description text DEFAULT 'Line item counts should match expected'
) RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  actual_total integer;
  actual_ai integer;
  actual_manual integer;
  results json;
BEGIN
  -- Get actual counts
  SELECT count(*) INTO actual_total
  FROM synapse.receipt_line_items
  WHERE expense_id = p_expense_id AND is_deleted = false;
  
  SELECT count(*) INTO actual_ai
  FROM synapse.receipt_line_items
  WHERE expense_id = p_expense_id AND is_ai_generated = true AND is_deleted = false;
  
  SELECT count(*) INTO actual_manual
  FROM synapse.receipt_line_items
  WHERE expense_id = p_expense_id AND is_ai_generated = false AND is_deleted = false;
  
  -- Return results instead of calling test functions
  results := json_build_object(
    'actual_total', actual_total,
    'actual_ai', actual_ai,
    'actual_manual', actual_manual,
    'expected_total', p_expected_total,
    'expected_ai', p_expected_ai,
    'expected_manual', p_expected_manual,
    'total_matches', (actual_total = p_expected_total),
    'ai_matches', (p_expected_ai IS NULL OR actual_ai = p_expected_ai),
    'manual_matches', (p_expected_manual IS NULL OR actual_manual = p_expected_manual),
    'description', p_test_description
  );
  
  RETURN results;
END;
$$;

-- Helper: Test soft delete behavior
CREATE OR REPLACE FUNCTION synapse_tests.test_line_item_soft_delete(
  p_line_item_id uuid
) RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  before_count integer;
  after_count integer;
  soft_delete_count integer;
BEGIN
  -- Count before soft delete
  SELECT count(*) INTO before_count
  FROM synapse.receipt_line_items
  WHERE id = p_line_item_id AND is_deleted = false;
  
  -- Perform soft delete
  UPDATE synapse.receipt_line_items
  SET is_deleted = true
  WHERE id = p_line_item_id;
  
  -- Count after soft delete
  SELECT count(*) INTO after_count
  FROM synapse.receipt_line_items
  WHERE id = p_line_item_id AND is_deleted = false;
  
  -- Count soft deleted items
  SELECT count(*) INTO soft_delete_count
  FROM synapse.receipt_line_items
  WHERE id = p_line_item_id AND is_deleted = true;
  
  RETURN json_build_object(
    'before_count', before_count,
    'after_count', after_count,
    'soft_delete_count', soft_delete_count,
    'soft_delete_worked', (before_count = 1 AND after_count = 0 AND soft_delete_count = 1)
  );
END;
$$;

-- Helper: Flexible cleanup function for specific test users
-- Now simplified since the database handles cascading deletes automatically
CREATE OR REPLACE FUNCTION public.cleanup_test_user_data(
  p_user_email text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
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
  
  -- 2. Clean up storage objects (not handled by CASCADE since it's in a different schema)
  DELETE FROM storage.objects WHERE bucket_id = 'receipts' AND owner_id = target_user_id;
  
  -- 3. Clean up any personal account (if exists)
  DELETE FROM public.accounts WHERE owner_id = target_user_id;
  
  -- 4. Clean up any team memberships (if exists)
  DELETE FROM public.account_members WHERE user_id = target_user_id;
  
  -- 5. Clean up any invitations (if exists)
  DELETE FROM public.invitations WHERE email = p_user_email;
  
  -- 6. Finally, clean up the user from auth (if we have the username)
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

-- Grant permissions after all functions are created
GRANT USAGE ON SCHEMA synapse_tests TO PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA synapse_tests TO PUBLIC;
