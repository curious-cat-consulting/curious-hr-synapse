-- Seed Expenses
-- User 1: curious@cat.com -> 11111111-1111-1111-1111-111111111111
-- User 2: curious+2@cat.com -> 22222222-2222-2222-2222-222222222222  
-- User 3: curious+3@cat.com -> 33333333-3333-3333-3333-333333333333

-- Insert some sample expenses for the test users
INSERT INTO synapse.expenses (
  id,
  user_id,
  title,
  description,
  status,
  created_at,
  updated_at
) VALUES 
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, -- Main test expense with line items
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Line Items',
    'Good Description',
    'ANALYZED',
    now(),
    now()
  ),
  (
    uuid_generate_v4 (),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Office Supplies',
    'Purchased notebooks, pens, and other office supplies',
    'NEW',
    now(),
    now()
  ),
  (
    uuid_generate_v4 (),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Team Lunch',
    'Team building lunch at local restaurant',
    'PENDING',
    now(),
    now()
  ),
  (
    uuid_generate_v4 (),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Software Subscription',
    'Monthly subscription for design software',
    'REJECTED',
    now(),
    now()
  );

-- Insert bulk expenses for all test users
INSERT INTO
    synapse.expenses (
    user_id,
    title,
    description,
    status,
    created_at,
    updated_at
  ) (
        select
            users.user_id,
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
            CASE 
                WHEN RANDOM() < 0.3 THEN 'NEW'
                WHEN RANDOM() < 0.6 THEN 'PENDING'
                WHEN RANDOM() < 0.8 THEN 'APPROVED'
                WHEN RANDOM() < 0.9 THEN 'ANALYZED'
                ELSE 'REJECTED'
            END::synapse.expense_status,
            now() - interval '1 day' * FLOOR(RANDOM() * 30),
            now() - interval '1 day' * FLOOR(RANDOM() * 30)
        FROM
            (SELECT '11111111-1111-1111-1111-111111111111'::uuid as user_id
             UNION SELECT '22222222-2222-2222-2222-222222222222'::uuid
             UNION SELECT '33333333-3333-3333-3333-333333333333'::uuid) users
        CROSS JOIN
            generate_series(1, 15)
    );