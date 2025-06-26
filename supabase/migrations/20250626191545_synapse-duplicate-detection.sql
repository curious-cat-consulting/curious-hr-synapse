/*
===============================================================================
                              DUPLICATE DETECTION
===============================================================================
*/

-- Function to detect receipt duplicates within the same account
CREATE OR REPLACE FUNCTION public.detect_receipt_duplicates(expense_id uuid)
  RETURNS json
  LANGUAGE plpgsql
  SET search_path = ''
AS $$
DECLARE
  duplicate_receipts json;
  current_account_id uuid;
BEGIN
  -- Get the account ID for the current expense
  SELECT e.account_id INTO current_account_id
  FROM synapse.expenses e
  WHERE e.id = detect_receipt_duplicates.expense_id;

  IF current_account_id IS NULL THEN
    RAISE EXCEPTION 'Expense not found';
  END IF;

  -- Verify the user has access to this expense
  IF NOT EXISTS (
    SELECT 1 FROM synapse.expenses 
    WHERE id = detect_receipt_duplicates.expense_id 
    AND user_id = auth.uid()
  ) AND NOT basejump.has_role_on_account(current_account_id, 'owner') THEN
    RAISE EXCEPTION 'Access denied: you can only check duplicates for your own expenses or team expenses you own';
  END IF;

  -- Find receipts in other expenses that match receipts in the current expense
  SELECT json_agg(
    json_build_object(
      'receipt_id', rm2.receipt_id,
      'vendor_name', rm2.vendor_name,
      'receipt_date', rm2.receipt_date,
      'receipt_total', rm2.receipt_total,
      'expense_id', rm2.expense_id,
      'expense_title', e2.title,
      'user_name', p.name,
      'similarity_score', 1.0,
      'match_reason', 'Exact match: same vendor, date, and amount'
    )
  ) INTO duplicate_receipts
  FROM synapse.receipt_metadata rm1
  JOIN synapse.expenses e1 ON e1.id = rm1.expense_id
  JOIN synapse.receipt_metadata rm2 ON
    rm2.vendor_name = rm1.vendor_name
    AND rm2.receipt_date = rm1.receipt_date
    AND ABS(rm2.receipt_total - rm1.receipt_total) < 0.01
    AND rm2.expense_id != rm1.expense_id
  JOIN synapse.expenses e2 ON e2.id = rm2.expense_id
  JOIN basejump.accounts p ON p.primary_owner_user_id = e2.user_id AND p.personal_account = true
  WHERE rm1.expense_id = detect_receipt_duplicates.expense_id
    AND e1.account_id = e2.account_id;

  RETURN COALESCE(duplicate_receipts, '[]'::json);
END;
$$;

-- Only grant execute on detect_receipt_duplicates
GRANT EXECUTE ON FUNCTION public.detect_receipt_duplicates(uuid) TO authenticated; 