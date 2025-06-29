-- E2E Test Users
-- This file contains users specifically for end-to-end testing
-- User: test@curiouscat.consulting -> 6027b4bd-0bcf-48e1-b803-195c6cb566c3

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
) VALUES (
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
); 