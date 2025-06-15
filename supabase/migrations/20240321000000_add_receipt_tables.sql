-- Create receipt metadata table
CREATE TABLE receipt_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id),
  vendor_name VARCHAR(255),
  vendor_address TEXT,
  receipt_date DATE,
  receipt_total DECIMAL,
  tax_amount DECIMAL,
  confidence_score DECIMAL,
  raw_ai_response JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create receipt line items table
CREATE TABLE receipt_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id),
  description TEXT NOT NULL,
  quantity DECIMAL,
  unit_price DECIMAL,
  total_amount DECIMAL NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_receipt_metadata_expense_id ON receipt_metadata(expense_id);
CREATE INDEX idx_receipt_line_items_expense_id ON receipt_line_items(expense_id);

-- Add RLS policies
ALTER TABLE receipt_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_line_items ENABLE ROW LEVEL SECURITY;

-- Create policies for receipt_metadata
CREATE POLICY "Users can view their own receipt metadata"
  ON receipt_metadata FOR SELECT
  USING (
    expense_id IN (
      SELECT id FROM expenses
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own receipt metadata"
  ON receipt_metadata FOR INSERT
  WITH CHECK (
    expense_id IN (
      SELECT id FROM expenses
      WHERE user_id = auth.uid()
    )
  );

-- Create policies for receipt_line_items
CREATE POLICY "Users can view their own receipt line items"
  ON receipt_line_items FOR SELECT
  USING (
    expense_id IN (
      SELECT id FROM expenses
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own receipt line items"
  ON receipt_line_items FOR INSERT
  WITH CHECK (
    expense_id IN (
      SELECT id FROM expenses
      WHERE user_id = auth.uid()
    )
  ); 