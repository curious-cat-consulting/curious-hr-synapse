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

CREATE POLICY "Users can update their own receipt line items"
  ON synapse.receipt_line_items FOR UPDATE
  USING (
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

/*
===============================================================================
                              RECEIPT LINE ITEMS RPC FUNCTIONS
===============================================================================
*/

/**
  Creates a new receipt line item for the current user
 */
CREATE OR REPLACE FUNCTION public.add_receipt_line_item(
  expense_id uuid,
  receipt_id uuid,
  description text,
  total_amount decimal,
  quantity decimal DEFAULT 1,
  unit_price decimal DEFAULT 0,
  category text DEFAULT NULL,
  line_item_date date DEFAULT CURRENT_DATE
)
  RETURNS json
  LANGUAGE plpgsql
  SET search_path = ''
AS
$$
DECLARE
  new_line_item synapse.receipt_line_items;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF expense_id IS NULL THEN
    RAISE EXCEPTION 'Expense ID is required';
  END IF;
  IF receipt_id IS NULL THEN
    RAISE EXCEPTION 'Receipt ID is required';
  END IF;
  IF description IS NULL OR trim(description) = '' THEN
    RAISE EXCEPTION 'Description is required';
  END IF;
  IF total_amount IS NULL OR total_amount <= 0 THEN
    RAISE EXCEPTION 'Total amount must be greater than 0';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM synapse.expenses 
    WHERE id = expense_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Expense not found or access denied';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM storage.objects 
    WHERE id = receipt_id AND owner_id::uuid = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Receipt not found or access denied';
  END IF;
  IF EXISTS (
    SELECT 1 FROM synapse.expenses 
    WHERE id = expense_id AND status IN ('APPROVED', 'REJECTED')
  ) THEN
    RAISE EXCEPTION 'Cannot add line items to expenses in this state';
  END IF;
  INSERT INTO synapse.receipt_line_items (
    expense_id,
    receipt_id,
    description,
    quantity,
    unit_price,
    total_amount,
    category,
    is_ai_generated,
    line_item_date
  ) VALUES (
    expense_id,
    receipt_id,
    description,
    quantity,
    unit_price,
    total_amount,
    category,
    false,
    line_item_date
  )
  RETURNING * INTO new_line_item;
  RETURN json_build_object(
    'id', new_line_item.id,
    'description', new_line_item.description,
    'quantity', new_line_item.quantity,
    'unit_price', new_line_item.unit_price,
    'total_amount', new_line_item.total_amount,
    'category', new_line_item.category,
    'is_ai_generated', new_line_item.is_ai_generated,
    'line_item_date', new_line_item.line_item_date,
    'created_at', new_line_item.created_at,
    '_type', 'regular'
  );
END;
$$;

/**
  Deletes a receipt line item for the current user
 */
CREATE OR REPLACE FUNCTION public.delete_receipt_line_item(line_item_id uuid)
  RETURNS json
  LANGUAGE plpgsql
  SET search_path = ''
AS
$$
DECLARE
  line_item_record synapse.receipt_line_items;
  expense_record synapse.expenses;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF line_item_id IS NULL THEN
    RAISE EXCEPTION 'Line item ID is required';
  END IF;
  SELECT * INTO line_item_record
  FROM synapse.receipt_line_items
  WHERE id = line_item_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Line item not found';
  END IF;
  SELECT * INTO expense_record
  FROM synapse.expenses
  WHERE id = line_item_record.expense_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expense not found';
  END IF;
  IF expense_record.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  IF expense_record.status IN ('APPROVED', 'REJECTED') THEN
    RAISE EXCEPTION 'Cannot delete line items in this state';
  END IF;
  IF line_item_record.is_ai_generated THEN
    UPDATE synapse.receipt_line_items
    SET is_deleted = true
    WHERE id = line_item_id;
  ELSE
    DELETE FROM synapse.receipt_line_items
    WHERE id = line_item_id;
  END IF;
  RETURN json_build_object('success', true);
END;
$$;

-- Grant execute permissions for receipt line items functions
GRANT EXECUTE ON FUNCTION public.add_receipt_line_item(uuid, uuid, text, decimal, decimal, decimal, text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_receipt_line_item(uuid) TO authenticated;