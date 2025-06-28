BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

select plan(4);

-- Setup multi-user scenario for cross-user testing
SELECT synapse_tests.setup_multi_user_scenario() as users \gset

-- Test 1: User can get download info for their own receipt
select tests.authenticate_as('user1');

-- Create a receipt for user1
INSERT INTO storage.objects (bucket_id, name, owner_id, metadata)
VALUES (
  'receipts', 
  concat(current_setting('test.user1_id'), '/', current_setting('test.user1_expense_id'), '/test-receipt.pdf'),
  current_setting('test.user1_id')::uuid,
  '{"mimetype": "application/pdf"}'::jsonb
);

-- Get the receipt ID
CREATE TEMP TABLE receipt_ids AS
SELECT id as receipt_id FROM storage.objects 
WHERE name = concat(current_setting('test.user1_id'), '/', current_setting('test.user1_expense_id'), '/test-receipt.pdf');

-- Test the function returns expected fields
SELECT is(
  (SELECT public.get_receipt_download_info(current_setting('test.user1_expense_id')::uuid, receipt_id) IS NOT NULL FROM receipt_ids),
  true,
  'User can get download info for their own receipt'
);

-- Test 2: Function returns correct file name from storage path
SELECT is(
  (SELECT (public.get_receipt_download_info(current_setting('test.user1_expense_id')::uuid, receipt_id)->>'file_name') FROM receipt_ids),
  'test-receipt.pdf',
  'Function correctly extracts file name from storage path'
);

-- Test 3: Function returns correct mime type
SELECT is(
  (SELECT (public.get_receipt_download_info(current_setting('test.user1_expense_id')::uuid, receipt_id)->>'mime_type') FROM receipt_ids),
  'application/pdf',
  'Function returns correct mime type from metadata'
);

-- Test 4: Function returns default mime type when not specified
-- Create another receipt without mime type metadata
INSERT INTO storage.objects (bucket_id, name, owner_id)
VALUES (
  'receipts', 
  concat(current_setting('test.user1_id'), '/', current_setting('test.user1_expense_id'), '/test-image.png'),
  current_setting('test.user1_id')::uuid
);

INSERT INTO receipt_ids (receipt_id)
SELECT id FROM storage.objects 
WHERE name = concat(current_setting('test.user1_id'), '/', current_setting('test.user1_expense_id'), '/test-image.png');

SELECT is(
  (SELECT (public.get_receipt_download_info(current_setting('test.user1_expense_id')::uuid, receipt_id)->>'mime_type') FROM receipt_ids WHERE receipt_id = (SELECT receipt_id FROM receipt_ids ORDER BY receipt_id DESC LIMIT 1)),
  'application/octet-stream',
  'Function returns default mime type when not specified in metadata'
);



SELECT *
FROM finish();

ROLLBACK; 