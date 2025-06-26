-- Seed Duplicate Expenses for Testing
-- This creates expenses with identical receipt metadata to test duplicate detection

-- Create storage objects for duplicate receipts
INSERT INTO storage.objects (
  id,
  bucket_id,
  name,
  owner_id,
  created_at,
  updated_at,
  last_accessed_at,
  metadata
) 
VALUES 
  -- First duplicate receipt storage object
  (
    gen_random_uuid(),
    'receipts',
    '11111111-1111-1111-1111-111111111111/duplicate-expense-1/receipt-duplicate-1.jpg',
    '11111111-1111-1111-1111-111111111111'::uuid,
    now() - interval '3 days',
    now() - interval '3 days',
    now() - interval '3 days',
    '{"mimetype": "image/jpeg", "size": 2048}'::jsonb
  ),
  -- Second duplicate receipt storage object (same vendor, date, amount)
  (
    gen_random_uuid(),
    'receipts',
    '11111111-1111-1111-1111-111111111111/duplicate-expense-2/receipt-duplicate-2.jpg',
    '11111111-1111-1111-1111-111111111111'::uuid,
    now() - interval '2 days',
    now() - interval '2 days',
    now() - interval '2 days',
    '{"mimetype": "image/jpeg", "size": 2048}'::jsonb
  ),
  -- Third duplicate receipt storage object (different vendor, same date/amount)
  (
    gen_random_uuid(),
    'receipts',
    '11111111-1111-1111-1111-111111111111/duplicate-expense-3/receipt-duplicate-3.jpg',
    '11111111-1111-1111-1111-111111111111'::uuid,
    now() - interval '1 day',
    now() - interval '1 day',
    now() - interval '1 day',
    '{"mimetype": "image/png", "size": 1536}'::jsonb
  ),
  -- Fourth duplicate receipt storage object (same vendor, date, amount as third)
  (
    gen_random_uuid(),
    'receipts',
    '11111111-1111-1111-1111-111111111111/duplicate-expense-4/receipt-duplicate-4.jpg',
    '11111111-1111-1111-1111-111111111111'::uuid,
    now() - interval '12 hours',
    now() - interval '12 hours',
    now() - interval '12 hours',
    '{"mimetype": "image/png", "size": 1536}'::jsonb
  );

-- Get the storage object IDs for the duplicate receipts
DO $$
DECLARE
    receipt_obj_id1 uuid;
    receipt_obj_id2 uuid;
    receipt_obj_id3 uuid;
    receipt_obj_id4 uuid;
BEGIN
    SELECT id INTO receipt_obj_id1 FROM storage.objects 
    WHERE name = '11111111-1111-1111-1111-111111111111/duplicate-expense-1/receipt-duplicate-1.jpg'
    LIMIT 1;
    
    SELECT id INTO receipt_obj_id2 FROM storage.objects 
    WHERE name = '11111111-1111-1111-1111-111111111111/duplicate-expense-2/receipt-duplicate-2.jpg'
    LIMIT 1;
    
    SELECT id INTO receipt_obj_id3 FROM storage.objects 
    WHERE name = '11111111-1111-1111-1111-111111111111/duplicate-expense-3/receipt-duplicate-3.jpg'
    LIMIT 1;
    
    SELECT id INTO receipt_obj_id4 FROM storage.objects 
    WHERE name = '11111111-1111-1111-1111-111111111111/duplicate-expense-4/receipt-duplicate-4.jpg'
    LIMIT 1;
    
    -- Store for later use
    PERFORM set_config('duplicate.receipt_obj_id1', receipt_obj_id1::text, false);
    PERFORM set_config('duplicate.receipt_obj_id2', receipt_obj_id2::text, false);
    PERFORM set_config('duplicate.receipt_obj_id3', receipt_obj_id3::text, false);
    PERFORM set_config('duplicate.receipt_obj_id4', receipt_obj_id4::text, false);
END $$;

-- Create duplicate expenses
INSERT INTO synapse.expenses (
  id,
  account_expense_id,
  user_id,
  account_id,
  title,
  description,
  amount,
  status,
  created_at,
  updated_at
)
VALUES 
  -- First duplicate expense (Office Depot)
  (
    gen_random_uuid(),
    (SELECT COALESCE(MAX(account_expense_id), 0) + 1 FROM synapse.expenses WHERE account_id = '11111111-1111-1111-1111-111111111111'::uuid),
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Duplicate Test - Office Depot Purchase',
    'Office supplies purchase from Office Depot including notebooks, pens, and desk organizers',
    125.50,
    'PENDING'::synapse.expense_status,
    now() - interval '3 days',
    now() - interval '3 days'
  ),
  -- Second duplicate expense (identical to first - Office Depot)
  (
    gen_random_uuid(),
    (SELECT COALESCE(MAX(account_expense_id), 0) + 2 FROM synapse.expenses WHERE account_id = '11111111-1111-1111-1111-111111111111'::uuid),
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Duplicate Test - Office Depot Purchase (Copy)',
    'Office supplies purchase from Office Depot including notebooks, pens, and desk organizers',
    125.50,
    'PENDING'::synapse.expense_status,
    now() - interval '2 days',
    now() - interval '2 days'
  ),
  -- Third duplicate expense (Staples)
  (
    gen_random_uuid(),
    (SELECT COALESCE(MAX(account_expense_id), 0) + 3 FROM synapse.expenses WHERE account_id = '11111111-1111-1111-1111-111111111111'::uuid),
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Duplicate Test - Staples Purchase',
    'Office supplies purchase from Staples including printer paper and ink cartridges',
    89.75,
    'PENDING'::synapse.expense_status,
    now() - interval '1 day',
    now() - interval '1 day'
  ),
  -- Fourth duplicate expense (identical to third - Staples)
  (
    gen_random_uuid(),
    (SELECT COALESCE(MAX(account_expense_id), 0) + 4 FROM synapse.expenses WHERE account_id = '11111111-1111-1111-1111-111111111111'::uuid),
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Duplicate Test - Staples Purchase (Copy)',
    'Office supplies purchase from Staples including printer paper and ink cartridges',
    89.75,
    'PENDING'::synapse.expense_status,
    now() - interval '12 hours',
    now() - interval '12 hours'
  );

-- Get the expense IDs for the duplicate expenses
DO $$
DECLARE
    expense_id1 uuid;
    expense_id2 uuid;
    expense_id3 uuid;
    expense_id4 uuid;
BEGIN
    SELECT id INTO expense_id1 FROM synapse.expenses 
    WHERE title = 'Duplicate Test - Office Depot Purchase'
    LIMIT 1;
    
    SELECT id INTO expense_id2 FROM synapse.expenses 
    WHERE title = 'Duplicate Test - Office Depot Purchase (Copy)'
    LIMIT 1;
    
    SELECT id INTO expense_id3 FROM synapse.expenses 
    WHERE title = 'Duplicate Test - Staples Purchase'
    LIMIT 1;
    
    SELECT id INTO expense_id4 FROM synapse.expenses 
    WHERE title = 'Duplicate Test - Staples Purchase (Copy)'
    LIMIT 1;
    
    -- Store for later use
    PERFORM set_config('duplicate.expense_id1', expense_id1::text, false);
    PERFORM set_config('duplicate.expense_id2', expense_id2::text, false);
    PERFORM set_config('duplicate.expense_id3', expense_id3::text, false);
    PERFORM set_config('duplicate.expense_id4', expense_id4::text, false);
END $$;

-- Create receipt metadata for the duplicate expenses
INSERT INTO synapse.receipt_metadata (
  expense_id,
  receipt_id,
  vendor_name,
  receipt_date,
  receipt_total,
  tax_amount,
  confidence_score,
  currency_code,
  created_at
)
VALUES 
  -- First duplicate receipt metadata (Office Depot)
  (
    current_setting('duplicate.expense_id1')::uuid,
    current_setting('duplicate.receipt_obj_id1')::uuid,
    'Office Depot',
    '2024-01-15',
    125.50,
    10.25,
    0.95,
    'USD',
    now() - interval '3 days'
  ),
  -- Second duplicate receipt metadata (identical to first - Office Depot)
  (
    current_setting('duplicate.expense_id2')::uuid,
    current_setting('duplicate.receipt_obj_id2')::uuid,
    'Office Depot',
    '2024-01-15',
    125.50,
    10.25,
    0.95,
    'USD',
    now() - interval '2 days'
  ),
  -- Third duplicate receipt metadata (Staples)
  (
    current_setting('duplicate.expense_id3')::uuid,
    current_setting('duplicate.receipt_obj_id3')::uuid,
    'Staples',
    '2024-01-16',
    89.75,
    7.25,
    0.92,
    'USD',
    now() - interval '1 day'
  ),
  -- Fourth duplicate receipt metadata (identical to third - Staples)
  (
    current_setting('duplicate.expense_id4')::uuid,
    current_setting('duplicate.receipt_obj_id4')::uuid,
    'Staples',
    '2024-01-16',
    89.75,
    7.25,
    0.92,
    'USD',
    now() - interval '12 hours'
  );

-- Update the account expense counter for the user who got the duplicate expenses
UPDATE synapse.account_expense_counters 
SET last_expense_id = (SELECT MAX(account_expense_id) FROM synapse.expenses WHERE account_id = '11111111-1111-1111-1111-111111111111'::uuid),
    updated_at = now()
WHERE account_id = '11111111-1111-1111-1111-111111111111'::uuid; 