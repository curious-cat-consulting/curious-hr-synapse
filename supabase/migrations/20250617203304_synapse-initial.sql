/*
===============================================================================
                              SCHEMA
===============================================================================
*/

-- Create synapse schema
CREATE SCHEMA IF NOT EXISTS synapse;
GRANT USAGE ON SCHEMA synapse TO authenticated;
GRANT USAGE ON SCHEMA synapse TO service_role;


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
  title text NOT NULL,
  amount decimal(10,2) NOT NULL,
  description text NOT NULL,
  status synapse.expense_status NOT NULL DEFAULT 'NEW',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  CONSTRAINT valid_expense_status CHECK (status IN ('ANALYZED', 'APPROVED', 'NEW', 'PENDING', 'REJECTED'))
);

-- Enable Row Level Security
ALTER TABLE synapse.expenses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own expenses
CREATE POLICY "Users can view their own expenses"
ON synapse.expenses FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own expenses
CREATE POLICY "Users can insert their own expenses"
ON synapse.expenses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own expenses
CREATE POLICY "Users can update their own expenses"
ON synapse.expenses FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Open up access to expenses
GRANT SELECT, INSERT, UPDATE ON TABLE synapse.expenses TO authenticated, service_role;

/*
===============================================================================
                              RPC FUNCTIONS
===============================================================================
*/

/**
  Returns the current user's expenses
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
    'created_at', e.created_at
  ) ORDER BY e.created_at DESC
), '[]'::json)
FROM synapse.expenses e
WHERE e.user_id = auth.uid();
$$;

/**
  Creates a new expense for the current user
 */
CREATE OR REPLACE FUNCTION public.create_expense(
  expense_title text,
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

  -- Create the expense
  INSERT INTO synapse.expenses (
    user_id,
    title,
    description,
    amount
  ) VALUES (
    auth.uid(),
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
    'created_at', new_expense.created_at
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_expenses() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_expense(text, text) TO authenticated;

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
USING ( (select auth.uid()) = owner );