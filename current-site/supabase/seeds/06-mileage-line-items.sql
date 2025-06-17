-- Seed Mileage Line Items
-- Main test expense: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa

INSERT INTO public.mileage_line_items (
  expense_id,
  from_address,
  to_address,
  category,
  miles_driven,
  calculated_miles,
  custom_miles,
  total_amount,
  created_at,
  line_item_date
) VALUES 
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- Airport trip 1
    '123 Main Street, Orlando, FL 32801',
    'Orlando International Airport, 1 Jeff Fuqua Blvd, Orlando, FL 32827',
    'Airport',
    15,
    15,
    null,
    9.83,
    now(),
    current_date - interval '2 days'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- Business trip
    '456 Business Park Dr, Orlando, FL 32819',
    '789 Corporate Center Blvd, Orlando, FL 32819',
    'Business',
    8,
    8,
    null,
    5.24,
    now(),
    current_date - interval '3 days'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- Client visit
    '321 Tech Way, Orlando, FL 32826',
    '654 Innovation Ave, Orlando, FL 32826',
    'Client Visit',
    12,
    12,
    null,
    7.86,
    now(),
    current_date - interval '1 day'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- Airport trip 2
    '987 Conference Center Dr, Orlando, FL 32819',
    'Orlando International Airport, 1 Jeff Fuqua Blvd, Orlando, FL 32827',
    'Airport',
    20,
    20,
    null,
    13.10,
    now(),
    current_date
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- Training trip
    '147 Training Center Ln, Orlando, FL 32819',
    '258 Education Blvd, Orlando, FL 32819',
    'Training',
    5,
    5,
    null,
    3.28,
    now(),
    current_date - interval '4 days'
  );