
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