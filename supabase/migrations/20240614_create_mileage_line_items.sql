-- Create mileage line items table
CREATE TABLE mileage_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id),
  from_address VARCHAR(255) NOT NULL,
  to_address VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  miles_driven DECIMAL NOT NULL,
  calculated_miles DECIMAL, -- system-calculated, can be overridden
  custom_miles DECIMAL,     -- user override
  total_amount DECIMAL NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  line_item_date DATE DEFAULT CURRENT_DATE
);

-- Add indexes for better query performance
CREATE INDEX idx_mileage_line_items_expense_id ON mileage_line_items(expense_id);

-- Add RLS policies
ALTER TABLE mileage_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mileage line items"
  ON mileage_line_items FOR SELECT
  USING (
    expense_id IN (
      SELECT id FROM expenses
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own mileage line items"
  ON mileage_line_items FOR INSERT
  WITH CHECK (
    expense_id IN (
      SELECT id FROM expenses
      WHERE user_id = auth.uid()
    )
  ); 