-- Seed Expenses for User 1 (curious@curiouscat.consulting)
-- User 1 ID: 11111111-1111-1111-1111-111111111111
-- Team Curious ID: 744dec03-c891-4663-a0b3-f9050473f173
-- Personal Account ID: 11111111-1111-1111-1111-111111111111 (same as user ID)

-- Insert 3 expenses for Team Curious (Team 1)
INSERT INTO synapse.expenses (
  id,
  account_expense_id,
  user_id,
  account_id,
  title,
  amount,
  description,
  status,
  created_at,
  updated_at
) VALUES 
  (
    gen_random_uuid(),
    1,
    '11111111-1111-1111-1111-111111111111', -- curious@curiouscat.consulting
    '744dec03-c891-4663-a0b3-f9050473f173', -- Team Curious
    'Team Lunch Meeting',
    45.75,
    'Lunch expenses for team meeting at local restaurant',
    'NEW',
    current_timestamp - interval '3 days',
    current_timestamp - interval '3 days'
  ),
  (
    gen_random_uuid(),
    2,
    '11111111-1111-1111-1111-111111111111', -- curious@curiouscat.consulting
    '744dec03-c891-4663-a0b3-f9050473f173', -- Team Curious
    'Office Supplies',
    23.50,
    'Printer paper, pens, and other office supplies',
    'NEW',
    current_timestamp - interval '1 day',
    current_timestamp - interval '1 day'
  ),
  (
    gen_random_uuid(),
    3,
    '22222222-2222-2222-2222-222222222222', -- curious+2@curiouscat.consulting
    '744dec03-c891-4663-a0b3-f9050473f173', -- Team Curious
    'Client Dinner',
    89.50,
    'Business dinner with potential client at upscale restaurant',
    'NEW',
    current_timestamp - interval '5 days',
    current_timestamp - interval '5 days'
  );

-- Insert 2 expenses for Personal Accounts
INSERT INTO synapse.expenses (
  id,
  account_expense_id,
  user_id,
  account_id,
  title,
  amount,
  description,
  status,
  created_at,
  updated_at
) VALUES 
  (
    gen_random_uuid(),
    1,
    '11111111-1111-1111-1111-111111111111', -- curious@curiouscat.consulting
    '11111111-1111-1111-1111-111111111111', -- Personal account
    'Personal Coffee Run',
    8.25,
    'Morning coffee and breakfast at local cafe',
    'NEW',
    current_timestamp - interval '2 hours',
    current_timestamp - interval '2 hours'
  ),
  (
    gen_random_uuid(),
    1,
    '22222222-2222-2222-2222-222222222222', -- curious+2@curiouscat.consulting
    '22222222-2222-2222-2222-222222222222', -- Personal account
    'Grocery Shopping',
    67.30,
    'Weekly grocery shopping at local supermarket',
    'NEW',
    current_timestamp - interval '1 day',
    current_timestamp - interval '1 day'
  );

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