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
  )
), '[]'::json)
FROM synapse.expenses e
WHERE e.user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_expenses() TO authenticated;