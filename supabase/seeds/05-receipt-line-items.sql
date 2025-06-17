-- Seed Receipt Line Items
-- Main test expense: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa

INSERT INTO public.receipt_line_items (
  expense_id,
  receipt_name,
  description,
  quantity,
  unit_price,
  total_amount,
  category,
  is_ai_generated,
  is_deleted,
  created_at
) VALUES 
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',-- Hotel GST tax
    '1750025272222-hotel-receipt-20.jpg',
    'GST - 12%',
    1,
    600,
    600,
    'Tax',
    true,
    false,
    '2025-06-15 22:15:47.134302'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- Manual line item
    'manual-entry',
    'Manual Line Item',
    3,
    50,
    150,
    'Category',
    false,
    false,
    '2025-06-15 22:08:35.903554'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',  -- Hotel room charges
    '1750025272222-hotel-receipt-20.jpg',
    'Room Charges - 04/04/2018',
    1,
    5000,
    5000,
    'Accommodation',
    true,
    false,
    '2025-06-15 22:15:47.134302'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- Airline fare
    '1750025272222-airline-ticket.png',
    'Fare',
    1,
    1040,
    1040,
    'Airfare',
    true,
    false,
    '2025-06-15 22:15:44.462024'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- Manual entry good description
    'manual-entry',
    'Good Description',
    1,
    20,
    20,
    'You know',
    false,
    false,
    '2025-06-15 23:21:04.014963'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- Deleted hotel room charge
    '1750025272222-hotel-receipt-20.jpg',
    'Room Charges - 04/04/2018 (1.00%)',
    1,
    50,
    50,
    'Accommodation',
    true,
    true,
    '2025-06-15 22:15:47.134302'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- Hotel laundry
    '1750025272222-hotel-receipt-20.jpg',
    'Laundry - 05/04/2018',
    22,
    10,
    220,
    'Service',
    true,
    false,
    '2025-06-15 22:15:47.134302'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- Deleted GST tax
    '1750025272222-hotel-receipt-20.jpg',
    'GST - 12%',
    1,
    600,
    600,
    'Tax',
    true,
    true,
    '2025-06-15 22:15:47.134302'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- Manual another entry
    'manual-entry',
    'Another',
    1.04,
    100,
    100,
    'cat',
    false,
    false,
    '2025-06-15 22:15:23.292785'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- Manual line item 2
    'manual-entry',
    'Manual Line Item 2',
    1,
    20,
    20,
    'Category',
    false,
    false,
    '2025-06-15 22:13:26.507186'
  );