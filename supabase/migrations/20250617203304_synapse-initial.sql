/*
===============================================================================
                              SCHEMA
===============================================================================
*/

-- Create synapse schema
CREATE SCHEMA IF NOT EXISTS synapse;
GRANT USAGE ON SCHEMA synapse TO authenticated;


/*
===============================================================================
                              CUSTOM TYPES & ENUMS
===============================================================================
*/

-- Create expense status enum type
CREATE TYPE synapse.expense_status AS ENUM ('ANALYZED', 'APPROVED', 'NEW', 'PENDING', 'REJECTED');


/*
===============================================================================
                              EXPENSES TABLE
===============================================================================
*/

-- Create expenses table
CREATE TABLE synapse.expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  account_id uuid REFERENCES basejump.accounts(id) NOT NULL,
  title text NOT NULL,
  amount decimal(10,2) NOT NULL,
  description text NOT NULL,
  status synapse.expense_status NOT NULL DEFAULT 'NEW',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  CONSTRAINT valid_expense_status CHECK (status IN ('ANALYZED', 'APPROVED', 'NEW', 'PENDING', 'REJECTED'))
);

-- Index for account_id
CREATE INDEX idx_expenses_account_id ON synapse.expenses(account_id);

-- Enable Row Level Security
ALTER TABLE synapse.expenses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view expenses for accounts they are a member of
CREATE POLICY "Users can view their account expenses"
ON synapse.expenses FOR SELECT
TO authenticated
USING (
  account_id IN (SELECT basejump.get_accounts_with_role())
);

-- Policy: Users can insert expenses for accounts they are a member of
CREATE POLICY "Users can insert expenses for their account"
ON synapse.expenses FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND account_id IN (SELECT basejump.get_accounts_with_role())
);

-- Policy: Users can update expenses for accounts they are a member of
CREATE POLICY "Users can update their account expenses"
ON synapse.expenses FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() AND account_id IN (SELECT basejump.get_accounts_with_role())
)
WITH CHECK (
  user_id = auth.uid() AND account_id IN (SELECT basejump.get_accounts_with_role())
);

-- Open up access to expenses
GRANT SELECT, INSERT, UPDATE ON TABLE synapse.expenses TO authenticated;

/*
===============================================================================
                              RPC FUNCTIONS
===============================================================================
*/

/**
  Returns the current user's expenses for all their accounts
 */
CREATE OR REPLACE FUNCTION public.get_expenses()
  RETURNS json
  LANGUAGE sql
AS
$$
SELECT COALESCE(json_agg(
  json_build_object(
    'id', e.id,
    'title', e.title,
    'description', e.description,
    'amount', e.amount,
    'status', e.status,
    'created_at', e.created_at,
    'account_id', e.account_id
  ) ORDER BY e.created_at DESC
), '[]'::json)
FROM synapse.expenses e
WHERE e.account_id IN (SELECT basejump.get_accounts_with_role());
$$;

/**
  Creates a new expense for the current user in a given account
 */
CREATE OR REPLACE FUNCTION public.create_expense(
  expense_title text,
  expense_account_id uuid,
  expense_description text DEFAULT NULL
)
  RETURNS json
  LANGUAGE plpgsql
AS
$$
DECLARE
  new_expense synapse.expenses;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate input
  IF expense_title IS NULL OR trim(expense_title) = '' THEN
    RAISE EXCEPTION 'Title is required';
  END IF;
  IF expense_account_id IS NULL THEN
    RAISE EXCEPTION 'Account ID is required';
  END IF;
  IF NOT basejump.has_role_on_account(expense_account_id) THEN
    RAISE EXCEPTION 'Access denied: you do not have access to this account';
  END IF;

  -- Create the expense
  INSERT INTO synapse.expenses (
    user_id,
    account_id,
    title,
    description,
    amount
  ) VALUES (
    auth.uid(),
    expense_account_id,
    expense_title,
    COALESCE(expense_description, expense_title),
    0
  )
  RETURNING * INTO new_expense;

  -- Return the created expense
  RETURN json_build_object(
    'id', new_expense.id,
    'title', new_expense.title,
    'description', new_expense.description,
    'amount', new_expense.amount,
    'status', new_expense.status,
    'created_at', new_expense.created_at,
    'account_id', new_expense.account_id
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_expenses() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_expense(text, uuid, text) TO authenticated;

/*
===============================================================================
                              STORAGE CONFIGURATION
===============================================================================
*/

-- Create storage bucket for receipts
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false);

-- Create policy to allow users to upload receipts for their own expenses
CREATE POLICY "Users can upload receipts for their own expenses"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- Create policy to allow users to view receipts for their own expenses
CREATE POLICY "Users can view receipts for their own expenses"
ON storage.objects FOR SELECT
TO authenticated
USING ( (select auth.uid()) = owner_id::uuid );