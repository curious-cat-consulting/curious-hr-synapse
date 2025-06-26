-- Seed Mileage Line Items
-- Generate random mileage items for all expenses

-- Generate mileage line items for expenses (1-5 mileage items per expense)
INSERT INTO synapse.mileage_line_items (
  expense_id,
  from_address,
  to_address,
  category,
  miles_driven,
  calculated_miles,
  custom_miles,
  mileage_rate,
  total_amount,
  created_at,
  line_item_date
)
SELECT 
  e.id as expense_id,
  CASE 
    WHEN mileage_num = 1 THEN '123 Main Street, Orlando, FL 32801'
    WHEN mileage_num = 2 THEN '456 Business Park Dr, Orlando, FL 32819'
    WHEN mileage_num = 3 THEN '789 Corporate Center Blvd, Orlando, FL 32819'
    WHEN mileage_num = 4 THEN '321 Tech Way, Orlando, FL 32826'
    ELSE '654 Innovation Ave, Orlando, FL 32826'
  END as from_address,
  CASE 
    WHEN mileage_num = 1 THEN 'Orlando International Airport, 1 Jeff Fuqua Blvd, Orlando, FL 32827'
    WHEN mileage_num = 2 THEN '789 Corporate Center Blvd, Orlando, FL 32819'
    WHEN mileage_num = 3 THEN '321 Tech Way, Orlando, FL 32826'
    WHEN mileage_num = 4 THEN '654 Innovation Ave, Orlando, FL 32826'
    ELSE '987 Conference Center Dr, Orlando, FL 32819'
  END as to_address,
  CASE 
    WHEN mileage_num = 1 THEN 'Airport'
    WHEN mileage_num = 2 THEN 'Business'
    WHEN mileage_num = 3 THEN 'Client Visit'
    WHEN mileage_num = 4 THEN 'Training'
    ELSE 'Conference'
  END as category,
  round((random() * 50 + 5)::numeric, 1) as miles_driven,
  round((random() * 50 + 5)::numeric, 1) as calculated_miles,
  CASE 
    WHEN random() < 0.2 THEN round((random() * 50 + 5)::numeric, 1)
    ELSE null
  END as custom_miles,
  CASE 
    WHEN mileage_num = 1 THEN 0.655 -- IRS standard rate
    WHEN mileage_num = 2 THEN 0.75  -- Higher rate for business travel
    WHEN mileage_num = 3 THEN 0.60  -- Lower rate for local travel
    WHEN mileage_num = 4 THEN 0.80  -- Premium rate for urgent travel
    ELSE 0.70  -- Standard business rate
  END as mileage_rate,
  round((random() * 50 + 5)::numeric * 
    CASE 
      WHEN mileage_num = 1 THEN 0.655
      WHEN mileage_num = 2 THEN 0.75
      WHEN mileage_num = 3 THEN 0.60
      WHEN mileage_num = 4 THEN 0.80
      ELSE 0.70
    END, 2) as total_amount,
  e.created_at + interval '1 day' * mileage_num as created_at,
  e.created_at::date + interval '1 day' * mileage_num as line_item_date
FROM synapse.expenses e
CROSS JOIN generate_series(1, 1 + floor(random() * 4)::int) as mileage_num
WHERE e.status IN ('NEW', 'PENDING', 'ANALYZED', 'APPROVED')
  AND random() < 0.4; -- 40% chance of having mileage items