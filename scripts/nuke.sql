-- Complete Database and Storage Reset Script
-- ⚠️  WARNING: This will delete ALL your data! Run only in development.

-- 1. Drop all RLS policies first
DROP POLICY IF EXISTS "Users can upload their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to insert expenses" ON expenses;
DROP POLICY IF EXISTS "Users can view their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;

-- 2. Drop application tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS expenses CASCADE;

-- 3. Drop Prisma migration tracking table
DROP TABLE IF EXISTS _prisma_migrations CASCADE;

-- 4. Delete all files from storage buckets
-- Note: You'll need to run this part separately or use the Supabase dashboard
-- This SQL won't work directly - you need to use the storage API or dashboard

-- To delete storage via SQL (if you have access), you can try:
-- DELETE FROM storage.objects WHERE bucket_id = 'receipts';

-- 5. Drop storage bucket (this might require service role permissions)
-- DELETE FROM storage.buckets WHERE id = 'receipts';

-- 6. Drop any custom functions or triggers you might have created
DROP FUNCTION IF EXISTS handle_updated_at() CASCADE;

-- 7. Reset any sequences that might have been created
-- (Usually not needed with UUID, but just in case)
-- DROP SEQUENCE IF EXISTS expenses_id_seq CASCADE;

-- 8. Clean up any remaining auth-related items specific to your app
-- (This won't affect Supabase's core auth tables, just any custom ones)

NOTIFY pgrst, 'reload schema';