-- Insert a test user with full name and avatar
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
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
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'curious@cat.com',
  crypt('curious', gen_salt('bf')),
  current_timestamp,
  current_timestamp,
  current_timestamp,
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Curious Cat","avatar_url":"https://th.bing.com/th/id/OIP.Q6R49EFCR62g4QtakGPRFAHaHZ?rs=1&pid=ImgDetMain&cb=idpwebpc1"}',
  current_timestamp,
  current_timestamp,
  '',
  '',
  '',
  ''
);

-- Insert some sample expenses for the test user
INSERT INTO public.expenses (
  user_id,
  profile_id,
  title,
  amount,
  description,
  status,
  created_at,
  updated_at
) VALUES 
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'Office Supplies',
    125.50,
    'Purchased notebooks, pens, and other office supplies',
    'pending',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'Team Lunch',
    85.00,
    'Team building lunch at local restaurant',
    'approved',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'Software Subscription',
    49.99,
    'Monthly subscription for design software',
    'rejected',
    now(),
    now()
  );

INSERT INTO public.expenses (
  id,
  user_id,
  profile_id,
  title,
  amount,
  description,
  status,
  created_at,
  updated_at
) VALUES (
  'a8456ad2-92c1-4af4-865f-ec35d73d1dc3',
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'line items',
  7800.00,
  'hmmm',
  'analyzed',
  '2025-06-15 22:07:52.211987+00',
  '2025-06-15 23:21:04.025197+00'
);

-- Insert receipt metadata
INSERT INTO public.receipt_metadata (
  id,
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
    '7cd01c45-1c85-4f60-bf06-be116f5514a5',
    'a8456ad2-92c1-4af4-865f-ec35d73d1dc3',
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
    '8de729b9-6732-4376-a013-c043fc0cf4fc',
    'a8456ad2-92c1-4af4-865f-ec35d73d1dc3',
    '1750025272222-hotel-receipt-20.jpg',
    'Hotel Name',
    '2018-04-08',
    null,
    1200,
    0.95,
    'USD',
    '2025-06-15 22:15:47.12279'
  );

-- Insert receipt line items
INSERT INTO public.receipt_line_items (
  id,
  expense_id,
  receipt_name,
  description,
  quantity,
  unit_price,
  total_amount,
  category,
  is_ai_generated,
  created_at
) VALUES 
  (
    '01a929f5-fac5-42a6-b76d-7c92e0305eb1',
    'a8456ad2-92c1-4af4-865f-ec35d73d1dc3',
    '1750025272222-hotel-receipt-20.jpg',
    'GST - 12%',
    1,
    600,
    600,
    'Tax',
    true,
    '2025-06-15 22:15:47.134302'
  ),
  (
    '02727451-4a34-472a-8c66-7c2d39e14ce6',
    'a8456ad2-92c1-4af4-865f-ec35d73d1dc3',
    'manual-entry',
    'Manual Line Item',
    3,
    50,
    150,
    'Category',
    false,
    '2025-06-15 22:08:35.903554'
  ),
  (
    '029b5d89-9c99-455c-89cc-4c8ae1c0942d',
    'a8456ad2-92c1-4af4-865f-ec35d73d1dc3',
    '1750025272222-hotel-receipt-20.jpg',
    'Room Charges - 04/04/2018',
    1,
    5000,
    5000,
    'Accommodation',
    true,
    '2025-06-15 22:15:47.134302'
  ),
  (
    '27a6e6ed-1e1b-458d-8336-b350f571cbb2',
    'a8456ad2-92c1-4af4-865f-ec35d73d1dc3',
    '1750025272222-airline-ticket.png',
    'Fare',
    1,
    1040,
    1040,
    'Airfare',
    true,
    '2025-06-15 22:15:44.462024'
  ),
  (
    '57f59296-cedb-46ce-af35-af5b3d1e76dd',
    'a8456ad2-92c1-4af4-865f-ec35d73d1dc3',
    'manual-entry',
    'Good Description',
    1,
    20,
    20,
    'You know',
    false,
    '2025-06-15 23:21:04.014963'
  ),
  (
    '5bd73e75-aeb4-48a8-a133-65958e5988dd',
    'a8456ad2-92c1-4af4-865f-ec35d73d1dc3',
    '1750025272222-hotel-receipt-20.jpg',
    'Room Charges - 04/04/2018 (1.00%)',
    1,
    50,
    50,
    'Accommodation',
    true,
    '2025-06-15 22:15:47.134302'
  ),
  (
    'c874d54a-0f98-4d31-b4b0-e1fe439bc31b',
    'a8456ad2-92c1-4af4-865f-ec35d73d1dc3',
    '1750025272222-hotel-receipt-20.jpg',
    'Laundry - 05/04/2018',
    22,
    10,
    220,
    'Service',
    true,
    '2025-06-15 22:15:47.134302'
  ),
  (
    'cf131c40-6b91-4c09-ac6b-83401c162949',
    'a8456ad2-92c1-4af4-865f-ec35d73d1dc3',
    '1750025272222-hotel-receipt-20.jpg',
    'GST - 12%',
    1,
    600,
    600,
    'Tax',
    true,
    '2025-06-15 22:15:47.134302'
  ),
  (
    'd4f3a9cc-1647-4726-8718-4983ebcd741f',
    'a8456ad2-92c1-4af4-865f-ec35d73d1dc3',
    'manual-entry',
    'Another',
    1.04,
    100,
    100,
    'cat',
    false,
    '2025-06-15 22:15:23.292785'
  ),
  (
    'f0c09648-bbc2-4560-9870-f299eb474dd7',
    'a8456ad2-92c1-4af4-865f-ec35d73d1dc3',
    'manual-entry',
    'Manual Line Item 2',
    1,
    20,
    20,
    'Category',
    false,
    '2025-06-15 22:13:26.507186'
  ); 