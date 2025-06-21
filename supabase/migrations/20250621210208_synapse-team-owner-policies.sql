/*
===============================================================================
                              TEAM OWNER POLICIES
===============================================================================
*/

-- Add team owner policy for receipt metadata
CREATE POLICY "Team owners can view member receipt metadata"
ON synapse.receipt_metadata FOR SELECT
TO authenticated
USING (
    expense_id IN (
        SELECT e.id
        FROM synapse.expenses e
        INNER JOIN basejump.account_user au ON au.user_id = e.user_id
        INNER JOIN basejump.accounts a ON a.id = au.account_id
        WHERE a.personal_account = false
        AND au.account_id IN (SELECT basejump.get_accounts_with_role('owner'))
    )
);

-- Add team owner policy for receipt line items
CREATE POLICY "Team owners can view member receipt line items"
ON synapse.receipt_line_items FOR SELECT
TO authenticated
USING (
    expense_id IN (
        SELECT e.id
        FROM synapse.expenses e
        INNER JOIN basejump.account_user au ON au.user_id = e.user_id
        INNER JOIN basejump.accounts a ON a.id = au.account_id
        WHERE a.personal_account = false
        AND au.account_id IN (SELECT basejump.get_accounts_with_role('owner'))
    )
);

-- Add team owner policy for mileage line items
CREATE POLICY "Team owners can view member mileage line items"
ON synapse.mileage_line_items FOR SELECT
TO authenticated
USING (
    expense_id IN (
        SELECT e.id
        FROM synapse.expenses e
        INNER JOIN basejump.account_user au ON au.user_id = e.user_id
        INNER JOIN basejump.accounts a ON a.id = au.account_id
        WHERE a.personal_account = false
        AND au.account_id IN (SELECT basejump.get_accounts_with_role('owner'))
    )
);

-- This function allows team owners to update the status of member expenses
CREATE OR REPLACE FUNCTION public.update_expense_status(
  expense_id uuid,
  new_status synapse.expense_status
)
  RETURNS json
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, basejump
AS
$$
DECLARE
  expense_user_id uuid;
  team_account_id uuid;
  updated_expense synapse.expenses;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get the expense and verify it exists
  SELECT user_id INTO expense_user_id
  FROM synapse.expenses
  WHERE id = update_expense_status.expense_id;

  IF expense_user_id IS NULL THEN
    RAISE EXCEPTION 'Expense not found';
  END IF;

  -- Check if the current user is the expense owner
  IF expense_user_id = auth.uid() THEN
    -- Expense owners can update their own expenses
    UPDATE synapse.expenses
    SET status = new_status, updated_at = now()
    WHERE id = update_expense_status.expense_id
    RETURNING * INTO updated_expense;
  ELSE
    -- Check if the current user is a team owner and the expense belongs to a team member
    SELECT au.account_id INTO team_account_id
    FROM basejump.account_user au
    WHERE au.user_id = expense_user_id
    AND au.account_id IN (SELECT basejump.get_accounts_with_role('owner'))
    LIMIT 1;

    IF team_account_id IS NULL THEN
      RAISE EXCEPTION 'Access denied: you can only update your own expenses or expenses of team members';
    END IF;

    -- Verify the current user is an owner of the team account
    IF NOT basejump.has_role_on_account(team_account_id, 'owner') THEN
      RAISE EXCEPTION 'Access denied: only team owners can update member expenses';
    END IF;

    -- Update the expense
    UPDATE synapse.expenses
    SET status = new_status, updated_at = now()
    WHERE id = update_expense_status.expense_id
    RETURNING * INTO updated_expense;
  END IF;

  -- Return the updated expense
  RETURN json_build_object(
    'id', updated_expense.id,
    'title', updated_expense.title,
    'description', updated_expense.description,
    'amount', updated_expense.amount,
    'status', updated_expense.status,
    'created_at', updated_expense.created_at,
    'updated_at', updated_expense.updated_at
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_expense_status(uuid, synapse.expense_status) TO authenticated;