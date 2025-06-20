/*
===============================================================================
                            RECEIPT METADATA TABLE
===============================================================================
*/

-- Create receipt metadata table
CREATE TABLE synapse.receipt_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES synapse.expenses(id),
  receipt_id UUID REFERENCES storage.objects(id) NOT NULL,
  vendor_name VARCHAR(255),
  receipt_date DATE,
  receipt_total DECIMAL,
  tax_amount DECIMAL,
  confidence_score DECIMAL,
  currency_code VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_receipt_metadata_expense_id ON synapse.receipt_metadata(expense_id);
CREATE INDEX idx_receipt_metadata_receipt_id ON synapse.receipt_metadata(receipt_id);

-- Add RLS policies
ALTER TABLE synapse.receipt_metadata ENABLE ROW LEVEL SECURITY;

-- Create policies for receipt_metadata
CREATE POLICY "Users can view their own receipt metadata"
  ON synapse.receipt_metadata FOR SELECT
  USING (
    expense_id IN (
      SELECT id FROM synapse.expenses
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own receipt metadata"
  ON synapse.receipt_metadata FOR INSERT
  WITH CHECK (
    expense_id IN (
      SELECT id FROM synapse.expenses
      WHERE user_id = auth.uid()
    )
  );

-- Open up access to receipt_metadata
GRANT SELECT, INSERT, UPDATE ON TABLE synapse.receipt_metadata TO authenticated;

/*
===============================================================================
                           RECEIPT LINE ITEMS TABLE
===============================================================================
*/

-- Create receipt line items table
CREATE TABLE synapse.receipt_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES synapse.expenses(id),
  receipt_id UUID REFERENCES storage.objects(id) NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL,
  unit_price DECIMAL,
  total_amount DECIMAL NOT NULL,
  category VARCHAR(100),
  is_ai_generated BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  line_item_date DATE DEFAULT CURRENT_DATE
);

-- Add indexes for better query performance
CREATE INDEX idx_receipt_line_items_expense_id ON synapse.receipt_line_items(expense_id);
CREATE INDEX idx_receipt_line_items_receipt_id ON synapse.receipt_line_items(receipt_id);

-- Add RLS policies
ALTER TABLE synapse.receipt_line_items ENABLE ROW LEVEL SECURITY;

-- Create policies for receipt_line_items
CREATE POLICY "Users can view their own receipt line items"
  ON synapse.receipt_line_items FOR SELECT
  USING (
    expense_id IN (
      SELECT id FROM synapse.expenses
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own receipt line items"
  ON synapse.receipt_line_items FOR INSERT
  WITH CHECK (
    expense_id IN (
      SELECT id FROM synapse.expenses
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own non-AI line items"
  ON synapse.receipt_line_items FOR DELETE
  USING (
    expense_id IN (
      SELECT id FROM synapse.expenses
      WHERE user_id = auth.uid()
    )
    AND is_ai_generated = false
  );

-- Open up access to receipt_line_items
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE synapse.receipt_line_items TO authenticated;