/*
===============================================================================
                        EXPENSE AMOUNT CALCULATION FUNCTIONS
===============================================================================
*/

-- Create function to update expense amount from all line item types
CREATE OR REPLACE FUNCTION synapse.update_expense_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the expense amount based on all line items (receipt and mileage)
  UPDATE synapse.expenses
  SET amount = (
    SELECT COALESCE(SUM(total_amount), 0)
    FROM (
      -- Sum from receipt line items (excluding soft deleted)
      SELECT total_amount
      FROM synapse.receipt_line_items
      WHERE expense_id = COALESCE(NEW.expense_id, OLD.expense_id)
        AND is_deleted = false
      
      UNION ALL
      
      -- Sum from mileage line items
      SELECT total_amount
      FROM synapse.mileage_line_items
      WHERE expense_id = COALESCE(NEW.expense_id, OLD.expense_id)
    ) AS all_line_items
  )
  WHERE id = COALESCE(NEW.expense_id, OLD.expense_id);
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle soft delete for receipt line items
CREATE OR REPLACE FUNCTION synapse.handle_receipt_line_item_soft_delete()
RETURNS TRIGGER AS $$
DECLARE
  new_sum numeric;
BEGIN
  -- Whenever is_deleted changes, update the expense amount
  SELECT COALESCE(SUM(total_amount), 0) INTO new_sum
  FROM (
    -- Sum from receipt line items (excluding soft deleted)
    SELECT total_amount
    FROM synapse.receipt_line_items
    WHERE expense_id = NEW.expense_id
      AND is_deleted = false
    
    UNION ALL
    
    -- Sum from mileage line items
    SELECT total_amount
    FROM synapse.mileage_line_items
    WHERE expense_id = NEW.expense_id
  ) AS all_line_items;

  UPDATE synapse.expenses
  SET amount = new_sum
  WHERE id = NEW.expense_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/*
===============================================================================
                            EXPENSE AMOUNT TRIGGERS
===============================================================================
*/

-- Create triggers for receipt_line_items
CREATE TRIGGER update_expense_amount_on_receipt_insert
  AFTER INSERT ON synapse.receipt_line_items
  FOR EACH ROW
  EXECUTE FUNCTION synapse.update_expense_amount();

CREATE TRIGGER update_expense_amount_on_receipt_update
  AFTER UPDATE ON synapse.receipt_line_items
  FOR EACH ROW
  WHEN (OLD.total_amount IS DISTINCT FROM NEW.total_amount)
  EXECUTE FUNCTION synapse.update_expense_amount();

CREATE TRIGGER update_expense_amount_on_receipt_delete
  AFTER DELETE ON synapse.receipt_line_items
  FOR EACH ROW
  EXECUTE FUNCTION synapse.update_expense_amount();

CREATE TRIGGER on_receipt_line_item_soft_delete
  AFTER UPDATE ON synapse.receipt_line_items
  FOR EACH ROW
  WHEN (OLD.is_deleted IS DISTINCT FROM NEW.is_deleted)
  EXECUTE FUNCTION synapse.handle_receipt_line_item_soft_delete();

-- Create triggers for mileage_line_items
CREATE TRIGGER update_expense_amount_on_mileage_insert
  AFTER INSERT ON synapse.mileage_line_items
  FOR EACH ROW
  EXECUTE FUNCTION synapse.update_expense_amount();

CREATE TRIGGER update_expense_amount_on_mileage_update
  AFTER UPDATE ON synapse.mileage_line_items
  FOR EACH ROW
  WHEN (OLD.total_amount IS DISTINCT FROM NEW.total_amount)
  EXECUTE FUNCTION synapse.update_expense_amount();

CREATE TRIGGER update_expense_amount_on_mileage_delete
  AFTER DELETE ON synapse.mileage_line_items
  FOR EACH ROW
  EXECUTE FUNCTION synapse.update_expense_amount();

/*
===============================================================================
                              GRANT PERMISSIONS
===============================================================================
*/

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION synapse.update_expense_amount() TO authenticated;
GRANT EXECUTE ON FUNCTION synapse.handle_receipt_line_item_soft_delete() TO authenticated; 