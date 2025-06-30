-- Simplified Expense Seed Data
-- Test users and team account
WITH test_data AS (
  SELECT 
    unnest(ARRAY[
      '11111111-1111-1111-1111-111111111111'::uuid,
      '22222222-2222-2222-2222-222222222222'::uuid,
      '33333333-3333-3333-3333-333333333333'::uuid
    ]) as user_id,
    '744dec03-c891-4663-a0b3-f9050473f173'::uuid as team_account_id
),
expense_templates AS (
  SELECT 
    unnest(ARRAY[
      'Office Supplies',
      'Business Travel',
      'Team Lunch',
      'Conference Registration',
      'Software License',
      'Marketing Materials',
      'Equipment Purchase',
      'Training Course',
      'Transportation',
      'Meeting Refreshments'
    ]) as title,
    unnest(ARRAY[
      'Office supplies and stationery',
      'Travel expenses for client meeting',
      'Team building lunch',
      'Professional conference registration',
      'Annual software license',
      'Marketing brochures and materials',
      'New equipment for development',
      'Professional training course',
      'Transportation to business meeting',
      'Coffee and refreshments for meeting'
    ]) as description,
    unnest(ARRAY[45.99, 125.50, 89.75, 299.00, 199.99, 75.25, 1299.00, 349.50, 25.00, 35.80]) as amount
),
generated_expenses AS (
  SELECT 
    ROW_NUMBER() OVER () as expense_num,
    td.user_id,
    CASE 
      WHEN ROW_NUMBER() OVER () % 3 = 0 THEN td.team_account_id
      ELSE td.user_id 
    END as account_id,
    et.title,
    et.description,
    et.amount,
    CASE 
      WHEN ROW_NUMBER() OVER () % 4 = 1 THEN 'NEW'::synapse.expense_status
      WHEN ROW_NUMBER() OVER () % 4 = 2 THEN 'PENDING'::synapse.expense_status
      WHEN ROW_NUMBER() OVER () % 4 = 3 THEN 'APPROVED'::synapse.expense_status
      ELSE 'REJECTED'::synapse.expense_status
    END as status,
    now() - (interval '1 day' * (random() * 30)::integer) as created_at
  FROM test_data td
  CROSS JOIN expense_templates et
),
final_expenses AS (
  SELECT 
    gen_random_uuid() as id,
    ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY expense_num) as account_expense_id,
    user_id,
    account_id,
    title,
    description,
    amount,
    status,
    created_at,
    created_at as updated_at
  FROM generated_expenses
)
INSERT INTO synapse.expenses (
  id, account_expense_id, user_id, account_id, 
  title, description, amount, status, 
  created_at, updated_at
)
SELECT * FROM final_expenses;

-- update existing counters since circumventing create_expense
INSERT INTO synapse.account_expense_counters (account_id, last_expense_id, updated_at)
SELECT 
  account_id,
  COALESCE(MAX(account_expense_id), 0) as last_expense_id,
  now() as updated_at
FROM synapse.expenses
GROUP BY account_id
ON CONFLICT (account_id) DO UPDATE SET
  last_expense_id = EXCLUDED.last_expense_id,
  updated_at = EXCLUDED.updated_at;