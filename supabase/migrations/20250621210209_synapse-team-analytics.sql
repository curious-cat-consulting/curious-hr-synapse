/*
===============================================================================
                              TEAM ANALYTICS FUNCTION
===============================================================================
*/

-- This function returns comprehensive analytics for team owners
CREATE OR REPLACE FUNCTION public.get_team_analytics(team_account_slug text)
  RETURNS json
  LANGUAGE plpgsql
  SET search_path = public, basejump
AS
$$
DECLARE
  team_account_id uuid;
  analytics_data json;
BEGIN
  -- Get the account ID from the slug using Basejump's API
  team_account_id := public.get_account_id(team_account_slug);

  -- Check if account exists
  IF team_account_id IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  -- Use Basejump's built-in permission check
  IF NOT basejump.has_role_on_account(team_account_id, 'owner') THEN
    RAISE EXCEPTION 'Only account owners can access this function';
  END IF;

  -- Get comprehensive analytics data
  WITH team_expenses AS (
    SELECT e.*, p.name as user_name
    FROM synapse.expenses e
    INNER JOIN basejump.account_user au ON au.user_id = e.user_id AND au.account_id = team_account_id
    INNER JOIN basejump.accounts p ON p.primary_owner_user_id = e.user_id AND p.personal_account = true
  ),
  expense_stats AS (
    SELECT 
      COUNT(*) as total_expenses,
      COUNT(CASE WHEN status = 'NEW' THEN 1 END) as new_expenses,
      COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_expenses,
      COUNT(CASE WHEN status = 'ANALYZED' THEN 1 END) as analyzed_expenses,
      COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_expenses,
      COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_expenses,
      SUM(amount) as total_amount,
      AVG(amount) as avg_amount,
      MIN(created_at) as first_expense_date,
      MAX(created_at) as last_expense_date
    FROM team_expenses
  ),
  member_stats AS (
    SELECT 
      COUNT(DISTINCT user_id) as total_members,
      COUNT(DISTINCT user_name) as unique_members
    FROM team_expenses
  ),
  expenses_per_member AS (
    SELECT 
      user_name,
      COUNT(*) as expense_count,
      SUM(amount) as total_amount,
      AVG(amount) as avg_amount
    FROM team_expenses
    GROUP BY user_name, user_id
    ORDER BY expense_count DESC
  ),
  ai_stats AS (
    SELECT 
      COUNT(DISTINCT rm.id) as total_receipt_metadata,
      COUNT(DISTINCT rli.id) as total_line_items,
      COUNT(DISTINCT CASE WHEN rli.is_ai_generated THEN rli.id END) as ai_generated_line_items,
      COUNT(DISTINCT CASE WHEN NOT rli.is_ai_generated THEN rli.id END) as manual_line_items,
      AVG(rm.confidence_score) as avg_confidence_score
    FROM team_expenses te
    LEFT JOIN synapse.receipt_metadata rm ON rm.expense_id = te.id
    LEFT JOIN synapse.receipt_line_items rli ON rli.expense_id = te.id AND (rli.is_deleted IS NULL OR rli.is_deleted = false)
  ),
  monthly_trends AS (
    SELECT 
      DATE_TRUNC('month', created_at) as month,
      COUNT(*) as expense_count,
      SUM(amount) as total_amount
    FROM team_expenses
    WHERE created_at >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month
  ),
  category_stats AS (
    SELECT 
      COALESCE(rli.category, 'Uncategorized') as category,
      COUNT(*) as line_item_count,
      SUM(rli.total_amount) as total_amount
    FROM team_expenses te
    LEFT JOIN synapse.receipt_line_items rli ON rli.expense_id = te.id AND (rli.is_deleted IS NULL OR rli.is_deleted = false)
    WHERE rli.id IS NOT NULL
    GROUP BY COALESCE(rli.category, 'Uncategorized')
    ORDER BY total_amount DESC
    LIMIT 10
  ),
  vendor_stats AS (
    SELECT 
      rm.vendor_name,
      COUNT(*) as receipt_count,
      SUM(rm.receipt_total) as total_amount,
      AVG(rm.confidence_score) as avg_confidence
    FROM team_expenses te
    LEFT JOIN synapse.receipt_metadata rm ON rm.expense_id = te.id
    WHERE rm.id IS NOT NULL
    GROUP BY rm.vendor_name
    ORDER BY total_amount DESC
    LIMIT 10
  )
  SELECT json_build_object(
    'overview', (
      SELECT json_build_object(
        'total_expenses', es.total_expenses,
        'total_amount', es.total_amount,
        'avg_amount', es.avg_amount,
        'total_members', ms.total_members,
        'first_expense_date', es.first_expense_date,
        'last_expense_date', es.last_expense_date
      )
      FROM expense_stats es, member_stats ms
    ),
    'status_breakdown', (
      SELECT json_build_object(
        'new', es.new_expenses,
        'pending', es.pending_expenses,
        'analyzed', es.analyzed_expenses,
        'approved', es.approved_expenses,
        'rejected', es.rejected_expenses
      )
      FROM expense_stats es
    ),
    'member_performance', (
      SELECT json_agg(
        json_build_object(
          'member_name', epm.user_name,
          'expense_count', epm.expense_count,
          'total_amount', epm.total_amount,
          'avg_amount', epm.avg_amount
        )
      )
      FROM expenses_per_member epm
    ),
    'ai_analytics', (
      SELECT json_build_object(
        'total_receipt_metadata', ais.total_receipt_metadata,
        'total_line_items', ais.total_line_items,
        'ai_generated_line_items', ais.ai_generated_line_items,
        'manual_line_items', ais.manual_line_items,
        'ai_generation_rate', CASE 
          WHEN ais.total_line_items > 0 
          THEN ROUND((ais.ai_generated_line_items::decimal / ais.total_line_items) * 100, 2)
          ELSE 0 
        END,
        'avg_confidence_score', ROUND(ais.avg_confidence_score * 100, 2)
      )
      FROM ai_stats ais
    ),
    'monthly_trends', (
      SELECT json_agg(
        json_build_object(
          'month', mt.month,
          'expense_count', mt.expense_count,
          'total_amount', mt.total_amount
        )
      )
      FROM monthly_trends mt
    ),
    'top_categories', (
      SELECT json_agg(
        json_build_object(
          'category', cs.category,
          'line_item_count', cs.line_item_count,
          'total_amount', cs.total_amount
        )
      )
      FROM category_stats cs
    ),
    'top_vendors', (
      SELECT json_agg(
        json_build_object(
          'vendor_name', vs.vendor_name,
          'receipt_count', vs.receipt_count,
          'total_amount', vs.total_amount,
          'avg_confidence', ROUND(vs.avg_confidence * 100, 2)
        )
      )
      FROM vendor_stats vs
    )
  ) INTO analytics_data;

  RETURN analytics_data;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_team_analytics(text) TO authenticated; 