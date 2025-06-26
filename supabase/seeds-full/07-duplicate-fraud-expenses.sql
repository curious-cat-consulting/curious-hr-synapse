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
  ),
  -- Fraud detection test receipts
  (
    gen_random_uuid(),
    'receipts',
    '11111111-1111-1111-1111-111111111111/fraud-high-risk/receipt-high-risk.jpg',
    '11111111-1111-1111-1111-111111111111'::uuid,
    now() - interval '6 hours',
    now() - interval '6 hours',
    now() - interval '6 hours',
    '{"mimetype": "image/jpeg", "size": 1024}'::jsonb
  ),
  (
    gen_random_uuid(),
    'receipts',
    '11111111-1111-1111-1111-111111111111/fraud-medium-risk/receipt-medium-risk.jpg',
    '11111111-1111-1111-1111-111111111111'::uuid,
    now() - interval '4 hours',
    now() - interval '4 hours',
    now() - interval '4 hours',
    '{"mimetype": "image/jpeg", "size": 2048}'::jsonb
  ),
  (
    gen_random_uuid(),
    'receipts',
    '11111111-1111-1111-1111-111111111111/fraud-low-risk/receipt-low-risk.jpg',
    '11111111-1111-1111-1111-111111111111'::uuid,
    now() - interval '2 hours',
    now() - interval '2 hours',
    now() - interval '2 hours',
    '{"mimetype": "image/jpeg", "size": 3072}'::jsonb
  ),
  (
    gen_random_uuid(),
    'receipts',
    '11111111-1111-1111-1111-111111111111/fraud-weekend/receipt-weekend.jpg',
    '11111111-1111-1111-1111-111111111111'::uuid,
    now() - interval '1 day',
    now() - interval '1 day',
    now() - interval '1 day',
    '{"mimetype": "image/jpeg", "size": 1536}'::jsonb
  ),
  (
    gen_random_uuid(),
    'receipts',
    '11111111-1111-1111-1111-111111111111/fraud-round-amount/receipt-round.jpg',
    '11111111-1111-1111-1111-111111111111'::uuid,
    now() - interval '30 minutes',
    now() - interval '30 minutes',
    now() - interval '30 minutes',
    '{"mimetype": "image/jpeg", "size": 1024}'::jsonb
  );

-- Get the storage object IDs for the duplicate receipts
DO $$
DECLARE
    receipt_obj_id1 uuid;
    receipt_obj_id2 uuid;
    receipt_obj_id3 uuid;
    receipt_obj_id4 uuid;
    receipt_obj_id_high uuid;
    receipt_obj_id_medium uuid;
    receipt_obj_id_low uuid;
    receipt_obj_id_weekend uuid;
    receipt_obj_id_round uuid;
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
    
    SELECT id INTO receipt_obj_id_high FROM storage.objects 
    WHERE name = '11111111-1111-1111-1111-111111111111/fraud-high-risk/receipt-high-risk.jpg'
    LIMIT 1;
    
    SELECT id INTO receipt_obj_id_medium FROM storage.objects 
    WHERE name = '11111111-1111-1111-1111-111111111111/fraud-medium-risk/receipt-medium-risk.jpg'
    LIMIT 1;
    
    SELECT id INTO receipt_obj_id_low FROM storage.objects 
    WHERE name = '11111111-1111-1111-1111-111111111111/fraud-low-risk/receipt-low-risk.jpg'
    LIMIT 1;
    
    SELECT id INTO receipt_obj_id_weekend FROM storage.objects 
    WHERE name = '11111111-1111-1111-1111-111111111111/fraud-weekend/receipt-weekend.jpg'
    LIMIT 1;
    
    SELECT id INTO receipt_obj_id_round FROM storage.objects 
    WHERE name = '11111111-1111-1111-1111-111111111111/fraud-round-amount/receipt-round.jpg'
    LIMIT 1;
    
    -- Store for later use
    PERFORM set_config('duplicate.receipt_obj_id1', receipt_obj_id1::text, false);
    PERFORM set_config('duplicate.receipt_obj_id2', receipt_obj_id2::text, false);
    PERFORM set_config('duplicate.receipt_obj_id3', receipt_obj_id3::text, false);
    PERFORM set_config('duplicate.receipt_obj_id4', receipt_obj_id4::text, false);
    PERFORM set_config('fraud.receipt_obj_id_high', receipt_obj_id_high::text, false);
    PERFORM set_config('fraud.receipt_obj_id_medium', receipt_obj_id_medium::text, false);
    PERFORM set_config('fraud.receipt_obj_id_low', receipt_obj_id_low::text, false);
    PERFORM set_config('fraud.receipt_obj_id_weekend', receipt_obj_id_weekend::text, false);
    PERFORM set_config('fraud.receipt_obj_id_round', receipt_obj_id_round::text, false);
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
    (SELECT COALESCE(MAX(account_expense_id), 0) + 1 FROM synapse.expenses WHERE account_id = '744dec03-c891-4663-a0b3-f9050473f173'::uuid),
    '11111111-1111-1111-1111-111111111111'::uuid,
    '744dec03-c891-4663-a0b3-f9050473f173'::uuid,
    'Duplicate Test - Office Depot Purchase',
    'Office supplies purchase from Office Depot including notebooks, pens, and desk organizers',
    125.50,
    'ANALYZED'::synapse.expense_status,
    now() - interval '3 days',
    now() - interval '3 days'
  ),
  -- Second duplicate expense (identical to first - Office Depot)
  (
    gen_random_uuid(),
    (SELECT COALESCE(MAX(account_expense_id), 0) + 2 FROM synapse.expenses WHERE account_id = '744dec03-c891-4663-a0b3-f9050473f173'::uuid),
    '11111111-1111-1111-1111-111111111111'::uuid,
    '744dec03-c891-4663-a0b3-f9050473f173'::uuid,
    'Duplicate Test - Office Depot Purchase (Copy)',
    'Office supplies purchase from Office Depot including notebooks, pens, and desk organizers',
    125.50,
    'ANALYZED'::synapse.expense_status,
    now() - interval '2 days',
    now() - interval '2 days'
  ),
  -- Third duplicate expense (Staples)
  (
    gen_random_uuid(),
    (SELECT COALESCE(MAX(account_expense_id), 0) + 3 FROM synapse.expenses WHERE account_id = '744dec03-c891-4663-a0b3-f9050473f173'::uuid),
    '11111111-1111-1111-1111-111111111111'::uuid,
    '744dec03-c891-4663-a0b3-f9050473f173'::uuid,
    'Duplicate Test - Staples Purchase',
    'Office supplies purchase from Staples including printer paper and ink cartridges',
    89.75,
    'ANALYZED'::synapse.expense_status,
    now() - interval '1 day',
    now() - interval '1 day'
  ),
  -- Fourth duplicate expense (identical to third - Staples)
  (
    gen_random_uuid(),
    (SELECT COALESCE(MAX(account_expense_id), 0) + 4 FROM synapse.expenses WHERE account_id = '744dec03-c891-4663-a0b3-f9050473f173'::uuid),
    '11111111-1111-1111-1111-111111111111'::uuid,
    '744dec03-c891-4663-a0b3-f9050473f173'::uuid,
    'Duplicate Test - Staples Purchase (Copy)',
    'Office supplies purchase from Staples including printer paper and ink cartridges',
    89.75,
    'APPROVED'::synapse.expense_status,
    now() - interval '12 hours',
    now() - interval '12 hours'
  ),
  -- HIGH RISK FRAUD: Large amount + weekend + low confidence + round amount
  (
    gen_random_uuid(),
    (SELECT COALESCE(MAX(account_expense_id), 0) + 5 FROM synapse.expenses WHERE account_id = '744dec03-c891-4663-a0b3-f9050473f173'::uuid),
    '11111111-1111-1111-1111-111111111111'::uuid,
    '744dec03-c891-4663-a0b3-f9050473f173'::uuid,
    'High Risk - Large Equipment Purchase',
    'Expensive equipment purchase from unknown vendor',
    5000.00,
    'PENDING'::synapse.expense_status,
    -- Weekend submission (last Sunday)
    (SELECT date_trunc('week', now()) - interval '1 week' + interval '6 days' + interval '14 hours'),
    (SELECT date_trunc('week', now()) - interval '1 week' + interval '6 days' + interval '14 hours')
  ),
  -- MEDIUM RISK FRAUD: Round amount + after hours + medium confidence
  (
    gen_random_uuid(),
    (SELECT COALESCE(MAX(account_expense_id), 0) + 6 FROM synapse.expenses WHERE account_id = '744dec03-c891-4663-a0b3-f9050473f173'::uuid),
    '11111111-1111-1111-1111-111111111111'::uuid,
    '744dec03-c891-4663-a0b3-f9050473f173'::uuid,
    'Medium Risk - Round Amount Purchase',
    'Round amount purchase from new vendor',
    1000.00,
    'PENDING'::synapse.expense_status,
    -- After hours submission (2 AM, yesterday)
    now() - interval '1 day' - interval '22 hours',
    now() - interval '1 day' - interval '22 hours'
  ),
  -- LOW RISK FRAUD: Weekend submission only
  (
    gen_random_uuid(),
    (SELECT COALESCE(MAX(account_expense_id), 0) + 7 FROM synapse.expenses WHERE account_id = '744dec03-c891-4663-a0b3-f9050473f173'::uuid),
    '11111111-1111-1111-1111-111111111111'::uuid,
    '744dec03-c891-4663-a0b3-f9050473f173'::uuid,
    'Low Risk - Weekend Lunch',
    'Business lunch on weekend',
    45.75,
    'PENDING'::synapse.expense_status,
    -- Weekend submission (last Saturday)
    (SELECT date_trunc('week', now()) - interval '1 week' + interval '5 days' + interval '12 hours'),
    (SELECT date_trunc('week', now()) - interval '1 week' + interval '5 days' + interval '12 hours')
  ),
  -- RAPID SUBMISSION: Multiple expenses in short time
  (
    gen_random_uuid(),
    (SELECT COALESCE(MAX(account_expense_id), 0) + 8 FROM synapse.expenses WHERE account_id = '744dec03-c891-4663-a0b3-f9050473f173'::uuid),
    '11111111-1111-1111-1111-111111111111'::uuid,
    '744dec03-c891-4663-a0b3-f9050473f173'::uuid,
    'Rapid Submission - Quick Purchase',
    'Quick purchase within 24 hours',
    75.25,
    'PENDING'::synapse.expense_status,
    now() - interval '1 hour',
    now() - interval '1 hour'
  ),
  (
    gen_random_uuid(),
    (SELECT COALESCE(MAX(account_expense_id), 0) + 9 FROM synapse.expenses WHERE account_id = '744dec03-c891-4663-a0b3-f9050473f173'::uuid),
    '11111111-1111-1111-1111-111111111111'::uuid,
    '744dec03-c891-4663-a0b3-f9050473f173'::uuid,
    'Rapid Submission - Another Quick Purchase',
    'Another quick purchase within 24 hours',
    125.00,
    'PENDING'::synapse.expense_status,
    now() - interval '30 minutes',
    now() - interval '30 minutes'
  ),
  (
    gen_random_uuid(),
    (SELECT COALESCE(MAX(account_expense_id), 0) + 10 FROM synapse.expenses WHERE account_id = '744dec03-c891-4663-a0b3-f9050473f173'::uuid),
    '11111111-1111-1111-1111-111111111111'::uuid,
    '744dec03-c891-4663-a0b3-f9050473f173'::uuid,
    'Rapid Submission - Third Quick Purchase',
    'Third quick purchase within 24 hours',
    200.00,
    'PENDING'::synapse.expense_status,
    now() - interval '15 minutes',
    now() - interval '15 minutes'
  ),
  (
    gen_random_uuid(),
    (SELECT COALESCE(MAX(account_expense_id), 0) + 11 FROM synapse.expenses WHERE account_id = '744dec03-c891-4663-a0b3-f9050473f173'::uuid),
    '11111111-1111-1111-1111-111111111111'::uuid,
    '744dec03-c891-4663-a0b3-f9050473f173'::uuid,
    'Rapid Submission - Fourth Quick Purchase',
    'Fourth quick purchase within 24 hours',
    150.00,
    'PENDING'::synapse.expense_status,
    now() - interval '10 minutes',
    now() - interval '10 minutes'
  ),
  (
    gen_random_uuid(),
    (SELECT COALESCE(MAX(account_expense_id), 0) + 12 FROM synapse.expenses WHERE account_id = '744dec03-c891-4663-a0b3-f9050473f173'::uuid),
    '11111111-1111-1111-1111-111111111111'::uuid,
    '744dec03-c891-4663-a0b3-f9050473f173'::uuid,
    'Rapid Submission - Fifth Quick Purchase',
    'Fifth quick purchase within 24 hours',
    175.00,
    'PENDING'::synapse.expense_status,
    now() - interval '5 minutes',
    now() - interval '5 minutes'
  ),
  (
    gen_random_uuid(),
    (SELECT COALESCE(MAX(account_expense_id), 0) + 13 FROM synapse.expenses WHERE account_id = '744dec03-c891-4663-a0b3-f9050473f173'::uuid),
    '11111111-1111-1111-1111-111111111111'::uuid,
    '744dec03-c891-4663-a0b3-f9050473f173'::uuid,
    'Rapid Submission - Sixth Quick Purchase',
    'Sixth quick purchase within 24 hours',
    225.00,
    'PENDING'::synapse.expense_status,
    now() - interval '2 minutes',
    now() - interval '2 minutes'
  );

-- Get the expense IDs for the duplicate expenses
DO $$
DECLARE
    expense_id1 uuid;
    expense_id2 uuid;
    expense_id3 uuid;
    expense_id4 uuid;
    expense_id_high uuid;
    expense_id_medium uuid;
    expense_id_low uuid;
    expense_id_rapid1 uuid;
    expense_id_rapid2 uuid;
    expense_id_rapid3 uuid;
    expense_id_rapid4 uuid;
    expense_id_rapid5 uuid;
    expense_id_rapid6 uuid;
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
    
    SELECT id INTO expense_id_high FROM synapse.expenses 
    WHERE title = 'High Risk - Large Equipment Purchase'
    LIMIT 1;
    
    SELECT id INTO expense_id_medium FROM synapse.expenses 
    WHERE title = 'Medium Risk - Round Amount Purchase'
    LIMIT 1;
    
    SELECT id INTO expense_id_low FROM synapse.expenses 
    WHERE title = 'Low Risk - Weekend Lunch'
    LIMIT 1;
    
    SELECT id INTO expense_id_rapid1 FROM synapse.expenses 
    WHERE title = 'Rapid Submission - Quick Purchase'
    LIMIT 1;
    
    SELECT id INTO expense_id_rapid2 FROM synapse.expenses 
    WHERE title = 'Rapid Submission - Another Quick Purchase'
    LIMIT 1;
    
    SELECT id INTO expense_id_rapid3 FROM synapse.expenses 
    WHERE title = 'Rapid Submission - Third Quick Purchase'
    LIMIT 1;
    
    SELECT id INTO expense_id_rapid4 FROM synapse.expenses 
    WHERE title = 'Rapid Submission - Fourth Quick Purchase'
    LIMIT 1;
    
    SELECT id INTO expense_id_rapid5 FROM synapse.expenses 
    WHERE title = 'Rapid Submission - Fifth Quick Purchase'
    LIMIT 1;
    
    SELECT id INTO expense_id_rapid6 FROM synapse.expenses 
    WHERE title = 'Rapid Submission - Sixth Quick Purchase'
    LIMIT 1;
    
    -- Store for later use
    PERFORM set_config('duplicate.expense_id1', expense_id1::text, false);
    PERFORM set_config('duplicate.expense_id2', expense_id2::text, false);
    PERFORM set_config('duplicate.expense_id3', expense_id3::text, false);
    PERFORM set_config('duplicate.expense_id4', expense_id4::text, false);
    PERFORM set_config('fraud.expense_id_high', expense_id_high::text, false);
    PERFORM set_config('fraud.expense_id_medium', expense_id_medium::text, false);
    PERFORM set_config('fraud.expense_id_low', expense_id_low::text, false);
    PERFORM set_config('fraud.expense_id_rapid1', expense_id_rapid1::text, false);
    PERFORM set_config('fraud.expense_id_rapid2', expense_id_rapid2::text, false);
    PERFORM set_config('fraud.expense_id_rapid3', expense_id_rapid3::text, false);
    PERFORM set_config('fraud.expense_id_rapid4', expense_id_rapid4::text, false);
    PERFORM set_config('fraud.expense_id_rapid5', expense_id_rapid5::text, false);
    PERFORM set_config('fraud.expense_id_rapid6', expense_id_rapid6::text, false);
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
  ),
  -- HIGH RISK: Low confidence score (0.65) + unknown vendor
  (
    current_setting('fraud.expense_id_high')::uuid,
    current_setting('fraud.receipt_obj_id_high')::uuid,
    'Unknown Equipment Co',
    '2024-01-20',
    5000.00,
    400.00,
    0.55,
    'USD',
    (SELECT date_trunc('week', now()) - interval '1 week' + interval '6 days' + interval '14 hours')
  ),
  -- MEDIUM RISK: Medium confidence score (0.78)
  (
    current_setting('fraud.expense_id_medium')::uuid,
    current_setting('fraud.receipt_obj_id_medium')::uuid,
    'New Vendor LLC',
    '2024-01-21',
    1000.00,
    80.00,
    0.65,
    'USD',
    now() - interval '1 day' - interval '22 hours'
  ),
  -- LOW RISK: High confidence score (0.92)
  (
    current_setting('fraud.expense_id_low')::uuid,
    current_setting('fraud.receipt_obj_id_low')::uuid,
    'Local Restaurant',
    '2024-01-20',
    45.75,
    3.75,
    0.92,
    'USD',
    (SELECT date_trunc('week', now()) - interval '1 week' + interval '5 days' + interval '12 hours')
  ),
  -- RAPID SUBMISSION: Multiple expenses with different vendors
  (
    current_setting('fraud.expense_id_rapid1')::uuid,
    current_setting('fraud.receipt_obj_id_high')::uuid,
    'Quick Mart',
    '2024-01-22',
    75.25,
    6.25,
    0.88,
    'USD',
    now() - interval '1 hour'
  ),
  (
    current_setting('fraud.expense_id_rapid2')::uuid,
    current_setting('fraud.receipt_obj_id_medium')::uuid,
    'Express Store',
    '2024-01-22',
    125.00,
    10.00,
    0.85,
    'USD',
    now() - interval '30 minutes'
  ),
  (
    current_setting('fraud.expense_id_rapid3')::uuid,
    current_setting('fraud.receipt_obj_id_low')::uuid,
    'Fast Shop',
    '2024-01-22',
    200.00,
    16.00,
    0.90,
    'USD',
    now() - interval '15 minutes'
  ),
  (
    current_setting('fraud.expense_id_rapid4')::uuid,
    current_setting('fraud.receipt_obj_id_high')::uuid,
    'Quick Mart',
    '2024-01-22',
    150.00,
    12.50,
    0.88,
    'USD',
    now() - interval '10 minutes'
  ),
  (
    current_setting('fraud.expense_id_rapid5')::uuid,
    current_setting('fraud.receipt_obj_id_medium')::uuid,
    'Express Store',
    '2024-01-22',
    175.00,
    14.00,
    0.85,
    'USD',
    now() - interval '5 minutes'
  ),
  (
    current_setting('fraud.expense_id_rapid6')::uuid,
    current_setting('fraud.receipt_obj_id_low')::uuid,
    'Fast Shop',
    '2024-01-22',
    225.00,
    18.00,
    0.90,
    'USD',
    now() - interval '2 minutes'
  );

-- Update the account expense counter for the user who got the duplicate expenses
UPDATE synapse.account_expense_counters 
SET last_expense_id = (SELECT MAX(account_expense_id) FROM synapse.expenses WHERE account_id = '744dec03-c891-4663-a0b3-f9050473f173'::uuid),
    updated_at = now()
WHERE account_id = '744dec03-c891-4663-a0b3-f9050473f173'::uuid; 