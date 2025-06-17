-- Seed Profiles
-- Update profile roles for the main user (Curious Cat)
UPDATE public.profiles
SET roles = ARRAY['MANAGER']::user_role[]
WHERE id = '11111111-1111-1111-1111-111111111111';