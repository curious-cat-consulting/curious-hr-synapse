-- Seed Receipt Line Items
-- Generate random line items for all receipts

-- First, create a storage object for manual entries
INSERT INTO storage.objects (
  id,
  bucket_id,
  name,
  owner_id,
  created_at,
  updated_at,
  last_accessed_at,
  metadata
) VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'receipts',
  'manual-entry',
  '11111111-1111-1111-1111-111111111111',
  now(),
  now(),
  now(),
  '{"mimetype": "application/json", "size": 0}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Generate line items for each receipt (2-6 line items per receipt)
INSERT INTO synapse.receipt_line_items (
  expense_id,
  receipt_id,
  description,
  quantity,
  unit_price,
  total_amount,
  category,
  is_ai_generated,
  is_deleted,
  created_at,
  line_item_date
)
SELECT 
  rm.expense_id,
  rm.receipt_id,
  CASE 
    WHEN line_num = 1 THEN 'Office Supplies'
    WHEN line_num = 2 THEN 'Paper Products'
    WHEN line_num = 3 THEN 'Writing Instruments'
    WHEN line_num = 4 THEN 'Electronics'
    WHEN line_num = 5 THEN 'Furniture'
    ELSE 'Miscellaneous Items'
  END as description,
  round((random() * 5 + 1)::numeric, 2) as quantity,
  round((random() * 100 + 10)::numeric, 2) as unit_price,
  round((random() * 200 + 20)::numeric, 2) as total_amount,
  CASE 
    WHEN line_num = 1 THEN 'Office Supplies'
    WHEN line_num = 2 THEN 'Paper Products'
    WHEN line_num = 3 THEN 'Writing Instruments'
    WHEN line_num = 4 THEN 'Electronics'
    WHEN line_num = 5 THEN 'Furniture'
    ELSE 'Miscellaneous'
  END as category,
  random() < 0.8 as is_ai_generated,
  random() < 0.1 as is_deleted,
  rm.created_at + interval '1 minute' * line_num as created_at,
  rm.receipt_date as line_item_date
FROM synapse.receipt_metadata rm
CROSS JOIN generate_series(1, 2 + floor(random() * 4)::int) as line_num
WHERE rm.receipt_id != 'dddddddd-dddd-dddd-dddd-dddddddddddd';

-- Generate manual line items for some expenses (1-3 per expense)
INSERT INTO synapse.receipt_line_items (
  expense_id,
  receipt_id,
  description,
  quantity,
  unit_price,
  total_amount,
  category,
  is_ai_generated,
  is_deleted,
  created_at,
  line_item_date
)
SELECT 
  e.id as expense_id,
  'dddddddd-dddd-dddd-dddd-dddddddddddd' as receipt_id,
  CASE 
    WHEN manual_num = 1 THEN 'Manual Entry - Office Supplies'
    WHEN manual_num = 2 THEN 'Manual Entry - Travel Expense'
    WHEN manual_num = 3 THEN 'Manual Entry - Meal Expense'
    ELSE 'Manual Entry - Miscellaneous'
  END as description,
  round((random() * 3 + 1)::numeric, 2) as quantity,
  round((random() * 50 + 10)::numeric, 2) as unit_price,
  round((random() * 150 + 25)::numeric, 2) as total_amount,
  CASE 
    WHEN manual_num = 1 THEN 'Office Supplies'
    WHEN manual_num = 2 THEN 'Travel'
    WHEN manual_num = 3 THEN 'Meals'
    ELSE 'Miscellaneous'
  END as category,
  false as is_ai_generated,
  false as is_deleted,
  e.created_at + interval '1 hour' * manual_num as created_at,
  e.created_at::date as line_item_date
FROM synapse.expenses e
CROSS JOIN generate_series(1, 1 + floor(random() * 2)::int) as manual_num
WHERE e.status IN ('NEW', 'PENDING', 'ANALYZED')
  AND random() < 0.6; -- 60% chance of having manual entries