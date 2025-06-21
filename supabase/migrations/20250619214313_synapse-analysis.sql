/*
===============================================================================
                              RPC FUNCTIONS
===============================================================================
*/

/**
  Returns receipts that need processing by comparing storage.objects with receipt_metadata
  for a specific expense. Returns receipts that exist in storage but not in metadata.
 */
CREATE OR REPLACE FUNCTION public.get_receipts_to_process(expense_id uuid)
  RETURNS json
  LANGUAGE sql
AS
$$
SELECT COALESCE(json_agg(
  json_build_object(
    'id', obj.id,
    'name', obj.name,
    'path', obj.name,
    'created_at', obj.created_at
  ) ORDER BY obj.created_at ASC
), '[]'::json)
FROM storage.objects obj
WHERE obj.bucket_id = 'receipts'
  AND obj.owner_id::uuid = auth.uid()
  AND (storage.foldername(obj.name))[1] = auth.uid()::text
  AND (storage.foldername(obj.name))[2] = expense_id::text
  AND obj.id NOT IN (
    SELECT rm.receipt_id
    FROM synapse.receipt_metadata rm 
    WHERE rm.expense_id = get_receipts_to_process.expense_id
  );
$$;

/**
  Updated get_expense_details function to include unprocessed receipts
 */
CREATE OR REPLACE FUNCTION public.get_expense_details(expense_id uuid)
  RETURNS json
  LANGUAGE sql
AS
$$
SELECT json_build_object(
  'id', e.id,
  'title', e.title,
  'description', e.description,
  'amount', e.amount,
  'status', e.status,
  'created_at', e.created_at,
  'updated_at', e.updated_at,
  'user_id', e.user_id,
  'currency_code', 'USD',
  'receipt_metadata', COALESCE(
    (SELECT json_agg(
      json_build_object(
        'id', rm.id,
        'receipt_id', rm.receipt_id,
        'vendor_name', rm.vendor_name,
        'receipt_date', rm.receipt_date,
        'receipt_total', rm.receipt_total,
        'tax_amount', rm.tax_amount,
        'confidence_score', rm.confidence_score,
        'currency_code', rm.currency_code,
        'created_at', rm.created_at
      ) ORDER BY rm.created_at
    ) FROM synapse.receipt_metadata rm 
    WHERE rm.expense_id = e.id),
    '[]'::json
  ),
  'unprocessed_receipts', public.get_receipts_to_process(e.id),
  'receipt_line_items', COALESCE(
    (SELECT json_agg(
      json_build_object(
        'id', rli.id,
        'receipt_id', rli.receipt_id,
        'description', rli.description,
        'quantity', rli.quantity,
        'unit_price', rli.unit_price,
        'total_amount', rli.total_amount,
        'category', rli.category,
        'is_ai_generated', rli.is_ai_generated,
        'is_deleted', rli.is_deleted,
        'line_item_date', rli.line_item_date,
        'created_at', rli.created_at,
        '_type', 'regular'
      ) ORDER BY rli.created_at
    ) FROM synapse.receipt_line_items rli 
    WHERE rli.expense_id = e.id),
    '[]'::json
  ),
  'mileage_line_items', COALESCE(
    (SELECT json_agg(
      json_build_object(
        'id', mli.id,
        'from_address', mli.from_address,
        'to_address', mli.to_address,
        'category', mli.category,
        'miles_driven', mli.miles_driven,
        'calculated_miles', mli.calculated_miles,
        'custom_miles', mli.custom_miles,
        'total_amount', mli.total_amount,
        'line_item_date', mli.line_item_date,
        'created_at', mli.created_at,
        '_type', 'miles'
      ) ORDER BY mli.created_at
    ) FROM synapse.mileage_line_items mli 
    WHERE mli.expense_id = e.id),
    '[]'::json
  )
)
FROM synapse.expenses e
WHERE e.id = expense_id
$$;

/**
  Stores receipt analysis data including metadata and line items.
  Takes an analysis object and receipt information, then creates the corresponding
  metadata and line item records.
 */
CREATE OR REPLACE FUNCTION synapse.store_receipt_analysis(
  expense_id uuid,
  receipt_id uuid,
  analysis_data jsonb
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
AS
$$
BEGIN
  -- Verify the user has access to this expense
  IF NOT EXISTS (
    SELECT 1 FROM synapse.expenses 
    WHERE id = store_receipt_analysis.expense_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: expense not found or not owned by user';
  END IF;

  -- Insert receipt metadata
  INSERT INTO synapse.receipt_metadata (
    expense_id,
    receipt_id,
    vendor_name,
    receipt_date,
    receipt_total,
    tax_amount,
    confidence_score,
    currency_code
  ) VALUES (
    store_receipt_analysis.expense_id,
    receipt_id,
    analysis_data->>'vendor_name',
    (analysis_data->>'receipt_date')::date,
    (analysis_data->>'receipt_total')::decimal,
    CASE 
      WHEN analysis_data->>'tax_amount' IS NOT NULL 
      THEN (analysis_data->>'tax_amount')::decimal 
      ELSE NULL 
    END,
    (analysis_data->>'confidence_score')::decimal,
    COALESCE(analysis_data->>'currency', 'USD')
  );

  -- Insert line items
  WITH line_items AS (
    SELECT 
      store_receipt_analysis.expense_id,
      receipt_id,
      (value->>'description')::text as description,
      CASE 
        WHEN value->>'quantity' IS NOT NULL 
        THEN (value->>'quantity')::decimal 
        ELSE NULL 
      END as quantity,
      CASE 
        WHEN value->>'unit_price' IS NOT NULL 
        THEN (value->>'unit_price')::decimal 
        ELSE NULL 
      END as unit_price,
      (value->>'total_amount')::decimal as total_amount,
      value->>'category' as category,
      CASE 
        WHEN value->>'date' IS NOT NULL 
        THEN (value->>'date')::date 
        ELSE NULL 
      END as line_item_date
    FROM jsonb_array_elements(analysis_data->'line_items')
  )
  INSERT INTO synapse.receipt_line_items (
    expense_id,
    receipt_id,
    description,
    quantity,
    unit_price,
    total_amount,
    category,
    is_ai_generated,
    line_item_date
  )
  SELECT 
    line_items.expense_id,
    line_items.receipt_id,
    line_items.description,
    line_items.quantity,
    line_items.unit_price,
    line_items.total_amount,
    line_items.category,
    true,
    COALESCE(line_items.line_item_date, (analysis_data->>'receipt_date')::date)
  FROM line_items;
END;
$$;

/**
  Stores multiple receipt analyses in a single transaction and marks the expense as analyzed.
  Takes an array of analysis objects with receipt information.
 */
CREATE OR REPLACE FUNCTION public.store_receipt_analyses(
  expense_id uuid,
  analyses_data jsonb
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
AS
$$
DECLARE
  analysis_record jsonb;
BEGIN
  -- Verify the user has access to this expense
  IF NOT EXISTS (
    SELECT 1 FROM synapse.expenses 
    WHERE id = store_receipt_analyses.expense_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: expense not found or not owned by user';
  END IF;

  -- Process each analysis
  FOR analysis_record IN SELECT * FROM jsonb_array_elements(analyses_data)
  LOOP
    PERFORM synapse.store_receipt_analysis(
      store_receipt_analyses.expense_id,
      (analysis_record->>'receiptId')::uuid,
      analysis_record->'analysis'
    );
  END LOOP;

  -- Mark expense as analyzed
  UPDATE synapse.expenses 
  SET status = 'ANALYZED'::synapse.expense_status
  WHERE id = store_receipt_analyses.expense_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_expense_details(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_receipts_to_process(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.store_receipt_analyses(uuid, jsonb) TO authenticated; 
