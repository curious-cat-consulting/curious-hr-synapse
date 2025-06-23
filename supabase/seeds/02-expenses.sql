-- Seed Expenses
-- User 1: curious@cat.com -> 11111111-1111-1111-1111-111111111111
-- User 2: curious+2@cat.com -> 22222222-2222-2222-2222-222222222222  
-- User 3: curious+3@cat.com -> 33333333-3333-3333-3333-333333333333
-- Team Curious account: 744dec03-c891-4663-a0b3-f9050473f173

-- Insert some sample expenses for the test users
INSERT INTO synapse.expenses (
  id,
  user_id,
  account_id,
  title,
  description,
  amount,
  status,
  created_at,
  updated_at
) VALUES 
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, -- Main test expense with line items (personal)
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid, -- User 1's personal account
    'Line Items',
    'Good Description',
    0,
    'ANALYZED'::synapse.expense_status,
    now(),
    now()
  ),
  (
    uuid_generate_v4 (),
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid, -- User 1's personal account
    'Office Supplies',
    'Purchased notebooks, pens, and other office supplies',
    0,
    'NEW'::synapse.expense_status,
    now(),
    now()
  ),
  (
    uuid_generate_v4 (),
    '11111111-1111-1111-1111-111111111111'::uuid,
    '744dec03-c891-4663-a0b3-f9050473f173'::uuid, -- Team Curious account
    'Team Lunch',
    'Team building lunch at local restaurant',
    0,
    'PENDING'::synapse.expense_status,
    now(),
    now()
  ),
  (
    uuid_generate_v4 (),
    '22222222-2222-2222-2222-222222222222'::uuid,
    '744dec03-c891-4663-a0b3-f9050473f173'::uuid, -- Team Curious account
    'Software Subscription',
    'Monthly subscription for design software',
    0,
    'REJECTED'::synapse.expense_status,
    now(),
    now()
  ),
  (
    uuid_generate_v4 (),
    '33333333-3333-3333-3333-333333333333'::uuid,
    '744dec03-c891-4663-a0b3-f9050473f173'::uuid, -- Team Curious account
    'Conference Travel',
    'Business travel to industry conference',
    0,
    'APPROVED'::synapse.expense_status,
    now(),
    now()
  );

-- Insert bulk expenses for all test users (mix of personal and team accounts)
INSERT INTO
    synapse.expenses (
    user_id,
    account_id,
    title,
    description,
    amount,
    status,
    created_at,
    updated_at
  )
  select
      users.user_id,
      CASE 
          WHEN (ROW_NUMBER() OVER ()) % 3 = 0 THEN '744dec03-c891-4663-a0b3-f9050473f173'::uuid -- Team Curious account
          ELSE users.user_id -- Personal account
      END,
      CASE 
          WHEN (ROW_NUMBER() OVER ()) % 10 = 1 THEN 'Office Supplies'
          WHEN (ROW_NUMBER() OVER ()) % 10 = 2 THEN 'Travel Expenses'
          WHEN (ROW_NUMBER() OVER ()) % 10 = 3 THEN 'Meal & Entertainment'
          WHEN (ROW_NUMBER() OVER ()) % 10 = 4 THEN 'Conference Registration'
          WHEN (ROW_NUMBER() OVER ()) % 10 = 5 THEN 'Software License'
          WHEN (ROW_NUMBER() OVER ()) % 10 = 6 THEN 'Marketing Materials'
          WHEN (ROW_NUMBER() OVER ()) % 10 = 7 THEN 'Equipment Purchase'
          WHEN (ROW_NUMBER() OVER ()) % 10 = 8 THEN 'Training Course'
          WHEN (ROW_NUMBER() OVER ()) % 10 = 9 THEN 'Taxi/Uber'
          ELSE 'Miscellaneous'
      END,
      CASE 
          WHEN (ROW_NUMBER() OVER ()) % 10 = 1 THEN 'Purchased office supplies for team'
          WHEN (ROW_NUMBER() OVER ()) % 10 = 2 THEN 'Business travel to client meeting'
          WHEN (ROW_NUMBER() OVER ()) % 10 = 3 THEN 'Team dinner after project completion'
          WHEN (ROW_NUMBER() OVER ()) % 10 = 4 THEN 'Industry conference attendance'
          WHEN (ROW_NUMBER() OVER ()) % 10 = 5 THEN 'Annual software subscription renewal'
          WHEN (ROW_NUMBER() OVER ()) % 10 = 6 THEN 'Brochures and promotional materials'
          WHEN (ROW_NUMBER() OVER ()) % 10 = 7 THEN 'New laptop for development work'
          WHEN (ROW_NUMBER() OVER ()) % 10 = 8 THEN 'Professional development training'
          WHEN (ROW_NUMBER() OVER ()) % 10 = 9 THEN 'Transportation to client site'
          ELSE 'General business expense'
      END,
      0,
      CASE 
          WHEN (ROW_NUMBER() OVER ()) % 4 = 1 THEN 'NEW'::synapse.expense_status
          WHEN (ROW_NUMBER() OVER ()) % 4 = 2 THEN 'PENDING'::synapse.expense_status
          WHEN (ROW_NUMBER() OVER ()) % 4 = 3 THEN 'APPROVED'::synapse.expense_status
          ELSE 'REJECTED'::synapse.expense_status
      END,
      now() - (interval '1 day' * (ROW_NUMBER() OVER () % 30)),
      now() - (interval '1 day' * (ROW_NUMBER() OVER () % 30))
  from (
      select '11111111-1111-1111-1111-111111111111'::uuid as user_id
      union all
      select '22222222-2222-2222-2222-222222222222'::uuid as user_id
      union all
      select '33333333-3333-3333-3333-333333333333'::uuid as user_id
  ) users
  cross join generate_series(1, 20) as n;