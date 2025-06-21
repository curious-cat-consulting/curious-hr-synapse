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