-- Seed Receipt Metadata
-- Generate random receipts for all expenses

-- First, create storage objects for receipts
INSERT INTO storage.objects (
  id,
  bucket_id,
  name,
  owner_id,
  created_at,
  updated_at,
  last_accessed_at,
  metadata
) 
-- Generate storage objects for each expense with random number of receipts (1-4 per expense)
SELECT 
  gen_random_uuid() as id,
  'receipts' as bucket_id,
  user_id::text || '/' || expense_id::text || '/' || 
  CASE 
    WHEN receipt_num = 1 THEN 'receipt-' || expense_id::text || '-1.jpg'
    WHEN receipt_num = 2 THEN 'receipt-' || expense_id::text || '-2.png'
    WHEN receipt_num = 3 THEN 'receipt-' || expense_id::text || '-3.pdf'
    ELSE 'receipt-' || expense_id::text || '-4.jpg'
  END as name,
  user_id as owner_id,
  created_at - interval '1 hour' * receipt_num as created_at,
  created_at - interval '1 hour' * receipt_num as updated_at,
  created_at - interval '1 hour' * receipt_num as last_accessed_at,
  CASE 
    WHEN receipt_num = 1 THEN '{"mimetype": "image/jpeg", "size": 1024}'::jsonb
    WHEN receipt_num = 2 THEN '{"mimetype": "image/png", "size": 2048}'::jsonb
    WHEN receipt_num = 3 THEN '{"mimetype": "application/pdf", "size": 5120}'::jsonb
    ELSE '{"mimetype": "image/jpeg", "size": 1536}'::jsonb
  END as metadata
FROM (
  SELECT 
    e.id as expense_id,
    e.user_id,
    e.created_at,
    generate_series(1, 1 + floor(random() * 3)::int) as receipt_num
  FROM synapse.expenses e
  WHERE e.status IN ('ANALYZED', 'PENDING', 'APPROVED')
) expense_receipts;

-- Then create receipt metadata using the storage object IDs
INSERT INTO synapse.receipt_metadata (
  expense_id,
  receipt_id,
  vendor_name,
  receipt_date,
  receipt_total,
  tax_amount,
  confidence_score,
  currency_code,
  created_at
)
SELECT 
  (string_to_array(obj.name, '/'))[2]::uuid as expense_id,
  obj.id as receipt_id,
  CASE 
    WHEN obj.name LIKE '%-1.jpg' THEN 'Office Depot'
    WHEN obj.name LIKE '%-2.png' THEN 'Staples'
    WHEN obj.name LIKE '%-3.pdf' THEN 'Amazon'
    ELSE 'Local Store'
  END as vendor_name,
  obj.created_at::date as receipt_date,
  CASE 
    WHEN random() < 0.7 THEN round((random() * 500 + 50)::numeric, 2)
    ELSE null
  END as receipt_total,
  CASE 
    WHEN random() < 0.6 THEN round((random() * 50 + 5)::numeric, 2)
    ELSE null
  END as tax_amount,
  round((random() * 0.1 + 0.9)::numeric, 2) as confidence_score,
  CASE 
    WHEN random() < 0.8 THEN 'USD'
    WHEN random() < 0.9 THEN 'EUR'
    ELSE 'CAD'
  END as currency_code,
  obj.created_at
FROM storage.objects obj
WHERE obj.bucket_id = 'receipts' 
  AND obj.name != 'manual-entry'
  AND obj.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/';