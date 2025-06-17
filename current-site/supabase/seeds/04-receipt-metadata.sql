-- Seed Receipt Metadata
-- Main test expense: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa

INSERT INTO public.receipt_metadata (
  expense_id,
  receipt_name,
  vendor_name,
  receipt_date,
  receipt_total,
  tax_amount,
  confidence_score,
  currency_code,
  created_at
) VALUES 
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- Emirates airline receipt
    '1750025272222-airline-ticket.png',
    'Emirates',
    '2011-02-17',
    null,
    245,
    0.95,
    'AED',
    '2025-06-15 22:15:44.451906'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- Hotel receipt
    '1750025272222-hotel-receipt-20.jpg',
    'Hotel Name',
    '2018-04-08',
    null,
    1200,
    0.95,
    'USD',
    '2025-06-15 22:15:47.12279'
  );