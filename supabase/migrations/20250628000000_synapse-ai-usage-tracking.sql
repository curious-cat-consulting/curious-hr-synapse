/*
===============================================================================
                              AI USAGE TRACKING
===============================================================================
This migration sets up AI usage tracking for monitoring OpenAI API usage,
token consumption, and performance metrics across the application.
*/

-- Create AI usage logs table
CREATE TABLE synapse.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  account_id uuid NOT NULL REFERENCES basejump.accounts(id),
  expense_id uuid NOT NULL REFERENCES synapse.expenses(id),
  
  -- AI Model Information
  model text NOT NULL,
  operation_type text NOT NULL, -- e.g., 'receipt_analysis', 'fraud_detection', 'duplicate_detection'
  
  -- Token Usage
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  
  -- Request/Response Details
  request_data jsonb, -- Store relevant request context
  response_data jsonb, -- Store relevant response data (excluding sensitive info)
  
  -- Status and Timing
  success boolean NOT NULL DEFAULT true,
  error_message text,
  processing_time_ms integer, -- Time taken for the AI operation
  
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes for efficient querying
CREATE INDEX idx_ai_usage_logs_user_id ON synapse.ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_account_id ON synapse.ai_usage_logs(account_id);
CREATE INDEX idx_ai_usage_logs_model ON synapse.ai_usage_logs(model);
CREATE INDEX idx_ai_usage_logs_operation_type ON synapse.ai_usage_logs(operation_type);
CREATE INDEX idx_ai_usage_logs_success ON synapse.ai_usage_logs(success);
CREATE INDEX idx_ai_usage_logs_created_at ON synapse.ai_usage_logs(created_at);

-- Add RLS policies
ALTER TABLE synapse.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own AI usage logs
CREATE POLICY "Users can insert their own AI usage logs" ON synapse.ai_usage_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

/*
===============================================================================
                              AI USAGE LOGGING FUNCTION
===============================================================================
*/

/**
  Function to log AI usage to the database.
  This function should be called after each AI operation to track usage metrics.
 */
CREATE OR REPLACE FUNCTION public.log_ai_usage(
  p_expense_id uuid,
  p_model text,
  p_operation_type text,
  p_prompt_tokens integer DEFAULT NULL,
  p_completion_tokens integer DEFAULT NULL,
  p_total_tokens integer DEFAULT NULL,
  p_request_data jsonb DEFAULT NULL,
  p_response_data jsonb DEFAULT NULL,
  p_success boolean DEFAULT true,
  p_error_message text DEFAULT NULL,
  p_processing_time_ms integer DEFAULT NULL
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS
$$
DECLARE
  v_log_id uuid;
  v_account_id uuid;
  v_user_id uuid;
BEGIN
  -- Get the account_id and user_id directly from the expense
  SELECT account_id, user_id INTO v_account_id, v_user_id
  FROM synapse.expenses
  WHERE id = p_expense_id;
  
  -- If no expense found, raise an error
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found for expense_id: %', p_expense_id;
  END IF;

  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'No account found for expense_id: %', p_expense_id;
  END IF;
  
  -- Insert the AI usage log
  INSERT INTO synapse.ai_usage_logs (
    user_id,
    account_id,
    expense_id,
    model,
    operation_type,
    prompt_tokens,
    completion_tokens,
    total_tokens,
    request_data,
    response_data,
    success,
    error_message,
    processing_time_ms
  ) VALUES (
    v_user_id,
    v_account_id,
    p_expense_id,
    p_model,
    p_operation_type,
    p_prompt_tokens,
    p_completion_tokens,
    p_total_tokens,
    p_request_data,
    p_response_data,
    p_success,
    p_error_message,
    p_processing_time_ms
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.log_ai_usage TO authenticated;