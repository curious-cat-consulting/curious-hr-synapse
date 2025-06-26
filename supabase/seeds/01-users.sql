-- Seed Users
-- User 1: curious@cat.com -> 11111111-1111-1111-1111-111111111111
-- User 2: curious+2@cat.com -> 22222222-2222-2222-2222-222222222222  
-- User 3: curious+3@cat.com -> 33333333-3333-3333-3333-333333333333

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
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'curious@cat.com',
  crypt('H047cCHxg7oDhmp0O6*D', gen_salt('bf')),
  current_timestamp,
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Curious Cat","avatar_url":"https://th.bing.com/th/id/OIP.Q6R49EFCR62g4QtakGPRFAHaHZ?rs=1&pid=ImgDetMain&cb=idpwebpc1"}',
  current_timestamp,
  current_timestamp,
  '',
  '',
  '',
  ''
),
(
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'authenticated',
  'authenticated',
  'curious+2@cat.com',
  crypt('H047cCHxg7oDhmp0O6*D', gen_salt('bf')),
  current_timestamp,
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Curious Cat 2","avatar_url":"https://th.bing.com/th/id/OIP.Q6R49EFCR62g4QtakGPRFAHaHZ?rs=1&pid=ImgDetMain&cb=idpwebpc1"}',
  current_timestamp,
  current_timestamp,
  '',
  '',
  '',
  ''
),
(
  '00000000-0000-0000-0000-000000000000',
  '33333333-3333-3333-3333-333333333333',
  'authenticated',
  'authenticated',
  'curious+3@cat.com',
  crypt('H047cCHxg7oDhmp0O6*D', gen_salt('bf')),
  current_timestamp,
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Curious Cat 3","avatar_url":"https://th.bing.com/th/id/OIP.Q6R49EFCR62g4QtakGPRFAHaHZ?rs=1&pid=ImgDetMain&cb=idpwebpc1"}',
  current_timestamp,
  current_timestamp,
  '',
  '',
  '',
  ''
);
