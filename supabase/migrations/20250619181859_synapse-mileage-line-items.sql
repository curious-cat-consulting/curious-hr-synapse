/*
===============================================================================
                           MILEAGE LINE ITEMS TABLE
===============================================================================
*/

-- Create mileage line items table
CREATE TABLE synapse.mileage_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES synapse.expenses(id),
  from_address VARCHAR(255) NOT NULL,
  to_address VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  miles_driven DECIMAL NOT NULL,
  calculated_miles DECIMAL, -- system-calculated, can be overridden
  custom_miles DECIMAL,     -- user override
  mileage_rate DECIMAL NOT NULL, -- no default, handled in application layer
  total_amount DECIMAL NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  line_item_date DATE DEFAULT CURRENT_DATE
);

-- Add indexes for better query performance
CREATE INDEX idx_mileage_line_items_expense_id ON synapse.mileage_line_items(expense_id);

-- Add RLS policies
ALTER TABLE synapse.mileage_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mileage line items"
  ON synapse.mileage_line_items FOR SELECT
  USING (
    expense_id IN (
      SELECT id FROM synapse.expenses
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own mileage line items"
  ON synapse.mileage_line_items FOR INSERT
  WITH CHECK (
    expense_id IN (
      SELECT id FROM synapse.expenses
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own mileage line items"
  ON synapse.mileage_line_items FOR UPDATE
  USING (
    expense_id IN (
      SELECT id FROM synapse.expenses
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own mileage line items"
  ON synapse.mileage_line_items FOR DELETE
  USING (
    expense_id IN (
      SELECT id FROM synapse.expenses
      WHERE user_id = auth.uid()
    )
  );

-- Open up access to mileage_line_items
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE synapse.mileage_line_items TO authenticated;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_expenses() TO authenticated;

/*
===============================================================================
                              MILEAGE LINE ITEMS RPC FUNCTIONS
===============================================================================
*/

/**
  Creates a new mileage line item for the current user
 */
CREATE OR REPLACE FUNCTION public.add_mileage_line_item(
  expense_id uuid,
  from_address text,
  to_address text,
  miles_driven decimal,
  total_amount decimal,
  mileage_rate decimal,
  category text DEFAULT NULL,
  line_item_date date DEFAULT CURRENT_DATE
)
  RETURNS json
  LANGUAGE plpgsql
AS
$$
DECLARE
  new_line_item synapse.mileage_line_items;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate input
  IF expense_id IS NULL THEN
    RAISE EXCEPTION 'Expense ID is required';
  END IF;

  IF from_address IS NULL OR trim(from_address) = '' THEN
    RAISE EXCEPTION 'From address is required';
  END IF;

  IF to_address IS NULL OR trim(to_address) = '' THEN
    RAISE EXCEPTION 'To address is required';
  END IF;

  IF miles_driven IS NULL OR miles_driven <= 0 THEN
    RAISE EXCEPTION 'Miles driven must be greater than 0';
  END IF;

  IF total_amount IS NULL OR total_amount <= 0 THEN
    RAISE EXCEPTION 'Total amount must be greater than 0';
  END IF;

  IF mileage_rate IS NULL OR mileage_rate <= 0 THEN
    RAISE EXCEPTION 'Mileage rate must be greater than 0';
  END IF;

  -- Verify the expense exists and belongs to the user
  IF NOT EXISTS (
    SELECT 1 FROM synapse.expenses 
    WHERE id = expense_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Expense not found or access denied';
  END IF;

  -- Check if the expense is in a state that allows adding line items
  IF EXISTS (
    SELECT 1 FROM synapse.expenses 
    WHERE id = expense_id AND status IN ('APPROVED', 'REJECTED')
  ) THEN
    RAISE EXCEPTION 'Cannot add line items to expenses in this state';
  END IF;

  -- Create the mileage line item
  INSERT INTO synapse.mileage_line_items (
    expense_id,
    from_address,
    to_address,
    category,
    miles_driven,
    total_amount,
    line_item_date,
    mileage_rate
  ) VALUES (
    expense_id,
    from_address,
    to_address,
    category,
    miles_driven,
    total_amount,
    line_item_date,
    mileage_rate
  )
  RETURNING * INTO new_line_item;

  -- Return the created mileage line item
  RETURN json_build_object(
    'id', new_line_item.id,
    'from_address', new_line_item.from_address,
    'to_address', new_line_item.to_address,
    'category', new_line_item.category,
    'miles_driven', new_line_item.miles_driven,
    'mileage_rate', new_line_item.mileage_rate,
    'total_amount', new_line_item.total_amount,
    'line_item_date', new_line_item.line_item_date,
    'created_at', new_line_item.created_at,
    '_type', 'miles'
  );
END;
$$;

/**
  Deletes a mileage line item for the current user
 */
CREATE OR REPLACE FUNCTION public.delete_mileage_line_item(line_item_id uuid)
  RETURNS json
  LANGUAGE plpgsql
AS
$$
DECLARE
  line_item_record synapse.mileage_line_items;
  expense_record synapse.expenses;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate input
  IF line_item_id IS NULL THEN
    RAISE EXCEPTION 'Line item ID is required';
  END IF;

  -- Get the line item
  SELECT * INTO line_item_record
  FROM synapse.mileage_line_items
  WHERE id = line_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mileage line item not found';
  END IF;

  -- Get the expense to check permissions and status
  SELECT * INTO expense_record
  FROM synapse.expenses
  WHERE id = line_item_record.expense_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expense not found';
  END IF;

  -- Check if the expense belongs to the user
  IF expense_record.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Check if the expense is in a state that allows deletion
  IF expense_record.status IN ('APPROVED', 'REJECTED') THEN
    RAISE EXCEPTION 'Cannot delete line items in this state';
  END IF;

  -- Delete the mileage line item
  DELETE FROM synapse.mileage_line_items
  WHERE id = line_item_id;

  RETURN json_build_object('success', true);
END;
$$;

-- Grant execute permissions for mileage line items functions
GRANT EXECUTE ON FUNCTION public.add_mileage_line_item(uuid, text, text, decimal, decimal, decimal, text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_mileage_line_item(uuid) TO authenticated;