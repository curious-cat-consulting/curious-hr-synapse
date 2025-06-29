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
  account_expense_id integer NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  account_id uuid REFERENCES basejump.accounts(id) NOT NULL,
  title text NOT NULL,
  amount decimal(10,2) NOT NULL,
  description text NOT NULL,
  status synapse.expense_status NOT NULL DEFAULT 'NEW',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  CONSTRAINT valid_expense_status CHECK (status IN ('ANALYZED', 'APPROVED', 'NEW', 'PENDING', 'REJECTED')),
  UNIQUE(account_id, account_expense_id)
);

-- Create table to track the last used account_expense_id per account (for thread safety)
CREATE TABLE synapse.account_expense_counters (
  account_id uuid REFERENCES basejump.accounts(id) ON DELETE CASCADE PRIMARY KEY,
  last_expense_id integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for account_id
CREATE INDEX idx_expenses_account_id ON synapse.expenses(account_id);
-- Index for account_expense_id lookups
CREATE INDEX idx_expenses_account_expense_id ON synapse.expenses(account_id, account_expense_id);

-- Enable Row Level Security
ALTER TABLE synapse.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE synapse.account_expense_counters ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view expenses for their own accounts
CREATE POLICY "Users can view their own expenses"
ON synapse.expenses FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() AND account_id IN (SELECT basejump.get_accounts_with_role())
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

-- Policy for account_expense_counters (only allow access to accounts user has access to)
CREATE POLICY "Users can access counters for their accounts"
ON synapse.account_expense_counters FOR ALL
TO authenticated
USING (
  account_id IN (SELECT basejump.get_accounts_with_role())
);

-- Open up access to expenses and counters
GRANT SELECT, INSERT, UPDATE ON TABLE synapse.expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE synapse.account_expense_counters TO authenticated;

/*
===============================================================================
                              RPC FUNCTIONS
===============================================================================
*/

/**
  Gets the next account expense ID for a given account (thread-safe)
 */
CREATE OR REPLACE FUNCTION synapse.get_next_account_expense_id(account_uuid uuid)
  RETURNS integer
  LANGUAGE plpgsql
  SET search_path = ''
AS
$$
DECLARE
  next_id integer;
BEGIN
  -- Use UPSERT to atomically get and increment the counter
  -- This prevents race conditions when multiple users create expenses simultaneously
  INSERT INTO synapse.account_expense_counters (account_id, last_expense_id)
  VALUES (account_uuid, 1)
  ON CONFLICT (account_id) 
  DO UPDATE SET 
    last_expense_id = synapse.account_expense_counters.last_expense_id + 1,
    updated_at = now()
  RETURNING last_expense_id INTO next_id;
  
  RETURN next_id;
END;
$$;

/**
  Returns the current user's expenses for all their accounts
 */
CREATE OR REPLACE FUNCTION public.get_expenses()
  RETURNS json
  LANGUAGE sql
  SET search_path = ''
AS
$$
SELECT COALESCE(json_agg(
  json_build_object(
    'id', e.id,
    'account_expense_id', e.account_expense_id,
    'title', e.title,
    'description', e.description,
    'amount', e.amount,
    'status', e.status,
    'created_at', e.created_at,
    'updated_at', e.updated_at,
    'user_id', e.user_id,
    'account_id', e.account_id,
    'account_name', a.name,
    'account_personal', a.personal_account
  ) ORDER BY e.created_at DESC
), '[]'::json)
FROM synapse.expenses e
INNER JOIN basejump.accounts a ON e.account_id = a.id
WHERE e.user_id = auth.uid() AND e.account_id IN (SELECT basejump.get_accounts_with_role());
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
  SET search_path = ''
AS
$$
DECLARE
  new_expense synapse.expenses;
  next_account_expense_id integer;
  account_name text;
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

  -- Get the next account expense ID
  SELECT synapse.get_next_account_expense_id(expense_account_id) INTO next_account_expense_id;

  -- Get account name for notification
  SELECT a.name INTO account_name
  FROM basejump.accounts a
  WHERE a.id = expense_account_id;

  -- Create the expense
  INSERT INTO synapse.expenses (
    user_id,
    account_id,
    account_expense_id,
    title,
    description,
    amount
  ) VALUES (
    auth.uid(),
    expense_account_id,
    next_account_expense_id,
    expense_title,
    COALESCE(expense_description, expense_title),
    0
  )
  RETURNING * INTO new_expense;

  -- Create notification for expense creation
  INSERT INTO synapse.notifications (
    user_id,
    account_id,
    type,
    title,
    message,
    metadata
  ) VALUES (
    auth.uid(),
    expense_account_id,
    'EXPENSE_CREATED'::synapse.notification_type,
    'New Expense Created',
    format('Expense "%s" has been created in %s', expense_title, account_name),
    jsonb_build_object(
      'expense_id', new_expense.id,
      'account_name', account_name
    )
  );

  -- Return the created expense
  RETURN json_build_object(
    'id', new_expense.id,
    'account_expense_id', new_expense.account_expense_id,
    'title', new_expense.title,
    'description', new_expense.description,
    'amount', new_expense.amount,
    'status', new_expense.status,
    'created_at', new_expense.created_at,
    'updated_at', new_expense.updated_at,
    'user_id', new_expense.user_id,
    'account_id', new_expense.account_id,
    'account_name', account_name,
    'account_personal', (SELECT personal_account FROM basejump.accounts WHERE id = new_expense.account_id),
    'currency_code', 'USD'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_expenses() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_expense(text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION synapse.get_next_account_expense_id(uuid) TO authenticated;

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