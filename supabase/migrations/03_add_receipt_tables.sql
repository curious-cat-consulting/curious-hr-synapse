/*
===============================================================================
                            RECEIPT METADATA TABLE
===============================================================================
*/

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

-- Add indexes for better query performance
CREATE INDEX idx_receipt_metadata_expense_id ON receipt_metadata(expense_id);
CREATE INDEX idx_receipt_metadata_receipt_name ON receipt_metadata(receipt_name);

-- Add RLS policies
ALTER TABLE receipt_metadata ENABLE ROW LEVEL SECURITY;

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

/*
===============================================================================
                           RECEIPT LINE ITEMS TABLE
===============================================================================
*/

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
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  line_item_date DATE DEFAULT CURRENT_DATE
);

-- Add indexes for better query performance
CREATE INDEX idx_receipt_line_items_expense_id ON receipt_line_items(expense_id);
CREATE INDEX idx_receipt_line_items_receipt_name ON receipt_line_items(receipt_name);

-- Add RLS policies
ALTER TABLE receipt_line_items ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can delete their own non-AI line items"
  ON receipt_line_items FOR DELETE
  USING (
    expense_id IN (
      SELECT id FROM expenses
      WHERE user_id = auth.uid()
    )
    AND is_ai_generated = false
  );

/*
===============================================================================
                        EXPENSE AMOUNT CALCULATION FUNCTIONS
===============================================================================
*/

-- Create function to update expense amount
CREATE OR REPLACE FUNCTION update_expense_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the expense amount based on all line items
  UPDATE expenses
  SET amount = (
    SELECT COALESCE(SUM(total_amount), 0)
    FROM receipt_line_items
    WHERE expense_id = COALESCE(NEW.expense_id, OLD.expense_id)
  )
  WHERE id = COALESCE(NEW.expense_id, OLD.expense_id);
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update expense amount when a line item is soft deleted
CREATE OR REPLACE FUNCTION public.handle_line_item_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
    -- Subtract the line item amount from the expense total
    UPDATE public.expenses
    SET amount = amount - OLD.total_amount
    WHERE id = OLD.expense_id;
  ELSIF NEW.is_deleted = FALSE AND OLD.is_deleted = TRUE THEN
    -- Add the line item amount back to the expense total
    UPDATE public.expenses
    SET amount = amount + NEW.total_amount
    WHERE id = NEW.expense_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/*
===============================================================================
                            EXPENSE AMOUNT TRIGGERS
===============================================================================
*/

-- Create triggers for line items
CREATE TRIGGER update_expense_amount_on_insert
  AFTER INSERT ON receipt_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_amount();

CREATE TRIGGER update_expense_amount_on_delete
  AFTER DELETE ON receipt_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_amount();

CREATE TRIGGER on_line_item_soft_delete
  AFTER UPDATE ON public.receipt_line_items
  FOR EACH ROW
  WHEN (OLD.is_deleted IS DISTINCT FROM NEW.is_deleted)
  EXECUTE FUNCTION public.handle_line_item_soft_delete();