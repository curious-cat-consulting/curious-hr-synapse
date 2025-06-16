-- Create receipt metadata table
CREATE TABLE receipt_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id),
  receipt_name VARCHAR(255) NOT NULL,
  vendor_name VARCHAR(255),
  receipt_date DATE,
  receipt_total DECIMAL,
  tax_amount DECIMAL,
  confidence_score DECIMAL,
  currency_code VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create receipt line items table
CREATE TABLE receipt_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id),
  receipt_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL,
  unit_price DECIMAL,
  total_amount DECIMAL NOT NULL,
  category VARCHAR(100),
  is_ai_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_receipt_metadata_expense_id ON receipt_metadata(expense_id);
CREATE INDEX idx_receipt_line_items_expense_id ON receipt_line_items(expense_id);
CREATE INDEX idx_receipt_metadata_receipt_name ON receipt_metadata(receipt_name);
CREATE INDEX idx_receipt_line_items_receipt_name ON receipt_line_items(receipt_name);

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