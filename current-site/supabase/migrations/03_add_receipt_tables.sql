

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