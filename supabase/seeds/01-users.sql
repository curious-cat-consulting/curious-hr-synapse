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

-- Create Team Curious account
-- Team account ID: 744dec03-c891-4663-a0b3-f9050473f173
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
  '744dec03-c891-4663-a0b3-f9050473f173',
  'Team Curious',
  'team-curious',
  '11111111-1111-1111-1111-111111111111', -- curious@cat.com as primary owner
  false, -- This is a team account, not personal
  current_timestamp,
  current_timestamp,
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '{}',
  '{}'
);

-- Add team members to the Team Curious account
INSERT INTO basejump.account_user (
  user_id,
  account_id,
  account_role
) VALUES 
  ('11111111-1111-1111-1111-111111111111', '744dec03-c891-4663-a0b3-f9050473f173', 'owner'), -- curious@cat.com as owner
  ('22222222-2222-2222-2222-222222222222', '744dec03-c891-4663-a0b3-f9050473f173', 'member'), -- curious+2@cat.com as member
  ('33333333-3333-3333-3333-333333333333', '744dec03-c891-4663-a0b3-f9050473f173', 'member'); -- curious+3@cat.com as member