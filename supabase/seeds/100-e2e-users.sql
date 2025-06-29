-- E2E Test Users
-- This file contains users specifically for end-to-end testing
-- User: test@curiouscat.consulting -> 6027b4bd-0bcf-48e1-b803-195c6cb566c3
-- User: test2@curiouscat.consulting -> 5e17d984-449e-4371-ad7b-b36f552ac24b

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES 
  (
    '00000000-0000-0000-0000-000000000000',
    '6027b4bd-0bcf-48e1-b803-195c6cb566c3',
    'authenticated',
    'authenticated',
    'test@curiouscat.consulting',
    crypt('curious', gen_salt('bf')),
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Curious Cat Tester","avatar_url":"https://th.bing.com/th/id/OIP.Q6R49EFCR62g4QtakGPRFAHaHZ?rs=1&pid=ImgDetMain&cb=idpwebpc1"}',
    current_timestamp,
    current_timestamp,
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '5e17d984-449e-4371-ad7b-b36f552ac24b',
    'authenticated',
    'authenticated',
    'test2@curiouscat.consulting',
    crypt('curious', gen_salt('bf')),
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Second Test User","avatar_url":"https://th.bing.com/th/id/OIP.Q6R49EFCR62g4QtakGPRFAHaHZ?rs=1&pid=ImgDetMain&cb=idpwebpc1"}',
    current_timestamp,
    current_timestamp,
    '',
    '',
    '',
    ''
  );

-- Create 5 test expenses for second e2e user with different statuses
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
) VALUES 
  (
    gen_random_uuid(),
    1,
    '5e17d984-449e-4371-ad7b-b36f552ac24b',
    '5e17d984-449e-4371-ad7b-b36f552ac24b',
    'Test Expense 1',
    'Description for Test Expense 1',
    50.00,
    'PENDING',
    now() - interval '1 day',
    now() - interval '1 day'
  ),
  (
    gen_random_uuid(),
    2,
    '5e17d984-449e-4371-ad7b-b36f552ac24b',
    '5e17d984-449e-4371-ad7b-b36f552ac24b',
    'Test Expense 2',
    'Description for Test Expense 2',
    75.50,
    'APPROVED',
    now() - interval '2 days',
    now() - interval '2 days'
  ),
  (
    gen_random_uuid(),
    3,
    '5e17d984-449e-4371-ad7b-b36f552ac24b',
    '5e17d984-449e-4371-ad7b-b36f552ac24b',
    'Test Expense 3',
    'Description for Test Expense 3',
    25.99,
    'REJECTED',
    now() - interval '3 days',
    now() - interval '3 days'
  ),
  (
    gen_random_uuid(),
    4,
    '5e17d984-449e-4371-ad7b-b36f552ac24b',
    '5e17d984-449e-4371-ad7b-b36f552ac24b',
    'Test Expense 4',
    'Description for Test Expense 4',
    100.00,
    'ANALYZED',
    now() - interval '4 days',
    now() - interval '4 days'
  ),
  (
    gen_random_uuid(),
    5,
    '5e17d984-449e-4371-ad7b-b36f552ac24b',
    '5e17d984-449e-4371-ad7b-b36f552ac24b',
    'Office Supplies Purchase',
    'Purchased office supplies for the team',
    123.45,
    'NEW',
    now(),
    now()
  );

-- Update account expense counter for second test user
INSERT INTO synapse.account_expense_counters (account_id, last_expense_id, updated_at)
VALUES ('5e17d984-449e-4371-ad7b-b36f552ac24b', 5, now())
ON CONFLICT (account_id) DO UPDATE SET
  last_expense_id = EXCLUDED.last_expense_id,
  updated_at = EXCLUDED.updated_at;

-- Create Test Team account for e2e testing
-- Team account ID: 99999999-9999-9999-9999-999999999999
INSERT INTO basejump.accounts (
  id,
  name,
  slug,
  primary_owner_user_id,
  personal_account,
  created_at,
  updated_at,
  created_by,
  updated_by,
  private_metadata,
  public_metadata
) VALUES (
  '99999999-9999-9999-9999-999999999999',
  'Test Team',
  'test-team',
  '6027b4bd-0bcf-48e1-b803-195c6cb566c3', -- test@curiouscat.consulting as primary owner
  false, -- This is a team account, not personal
  current_timestamp,
  current_timestamp,
  '6027b4bd-0bcf-48e1-b803-195c6cb566c3',
  '6027b4bd-0bcf-48e1-b803-195c6cb566c3',
  '{}',
  '{}'
);

-- Add both e2e users to the Test Team
INSERT INTO basejump.account_user (
  user_id,
  account_id,
  account_role
) VALUES 
  ('6027b4bd-0bcf-48e1-b803-195c6cb566c3', '99999999-9999-9999-9999-999999999999', 'owner'),
  ('5e17d984-449e-4371-ad7b-b36f552ac24b', '99999999-9999-9999-9999-999999999999', 'member'); 