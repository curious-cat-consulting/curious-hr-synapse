-- Insert a test user with full name and avatar
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'curious@cat.com',
  crypt('curious', gen_salt('bf')),
  current_timestamp,
  current_timestamp,
  current_timestamp,
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Curious Cat","avatar_url":"https://th.bing.com/th/id/OIP.Q6R49EFCR62g4QtakGPRFAHaHZ?rs=1&pid=ImgDetMain&cb=idpwebpc1"}',
  current_timestamp,
  current_timestamp,
  '',
  '',
  '',
  ''
);

-- Insert some sample expenses for the test user
INSERT INTO public.expenses (
  user_id,
  profile_id,
  title,
  amount,
  description,
  status,
  created_at,
  updated_at
) VALUES 
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'Office Supplies',
    125.50,
    'Purchased notebooks, pens, and other office supplies',
    'pending',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'Team Lunch',
    85.00,
    'Team building lunch at local restaurant',
    'approved',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'Software Subscription',
    49.99,
    'Monthly subscription for design software',
    'rejected',
    now(),
    now()
  );