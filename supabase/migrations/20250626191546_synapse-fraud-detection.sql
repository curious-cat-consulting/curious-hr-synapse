/*
===============================================================================
                              FRAUD DETECTION
===============================================================================
*/

-- Function to detect potential fraud patterns for team accounts
CREATE OR REPLACE FUNCTION public.detect_fraud_patterns(account_id uuid)
  RETURNS json
  LANGUAGE plpgsql
  SET search_path = ''
AS $$
DECLARE
  fraud_indicators json;
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Verify the user has owner access to this account
  IF NOT basejump.has_role_on_account(account_id, 'owner') THEN
    RAISE EXCEPTION 'Access denied: only team owners can view fraud detection data';
  END IF;

  -- Detect various fraud patterns
  WITH fraud_analysis AS (
    SELECT 
      -- 1. Unusual spending patterns (expenses significantly above user's average)
      CASE 
        WHEN e.amount > (avg_amount * 3) THEN 'HIGH_AMOUNT_ANOMALY'
        WHEN e.amount > (avg_amount * 2) THEN 'MEDIUM_AMOUNT_ANOMALY'
        ELSE NULL
      END as amount_anomaly,
      
      -- 2. Rapid submission patterns (multiple expenses in short time)
      CASE 
        WHEN expense_count_24h > 5 THEN 'RAPID_SUBMISSION'
        WHEN expense_count_24h > 3 THEN 'FREQUENT_SUBMISSION'
        ELSE NULL
      END as submission_pattern,
      
      -- 3. Weekend/after-hours submissions (potential personal expense abuse)
      CASE 
        WHEN EXTRACT(DOW FROM e.created_at) IN (0, 6) THEN 'WEEKEND_SUBMISSION'
        WHEN EXTRACT(HOUR FROM e.created_at) NOT BETWEEN 6 AND 20 THEN 'AFTER_HOURS_SUBMISSION'
        ELSE NULL
      END as timing_anomaly,
      
      -- 4. Vendor patterns (unusual vendors for the team)
      CASE 
        WHEN vendor_count < 2 THEN 'UNUSUAL_VENDOR'
        ELSE NULL
      END as vendor_anomaly,
      
      -- 5. Amount patterns (round numbers, common fraud indicators)
      CASE 
        WHEN e.amount = ROUND(e.amount, 0) THEN 'ROUND_AMOUNT'
        WHEN e.amount IN (50, 100, 200, 500, 1000) THEN 'SUSPICIOUS_AMOUNT'
        ELSE NULL
      END as amount_pattern,
      
      -- 6. Receipt quality issues (low confidence scores)
      CASE 
        WHEN avg_confidence < 0.7 THEN 'LOW_RECEIPT_QUALITY'
        WHEN avg_confidence < 0.85 THEN 'MEDIUM_RECEIPT_QUALITY'
        ELSE NULL
      END as receipt_quality,
      
      -- Expense details
      e.id as expense_id,
      e.account_expense_id,
      e.title,
      e.amount,
      e.status,
      e.created_at,
      e.user_id,
      p.name as user_name,
      rm.vendor_name,
      avg_amount,
      expense_count_24h,
      vendor_count,
      avg_confidence,
      
      -- Calculate fraud risk score (0-100)
      (
        CASE WHEN e.amount > (avg_amount * 3) THEN 25 ELSE 0 END +
        CASE WHEN expense_count_24h > 5 THEN 20 ELSE 0 END +
        CASE WHEN EXTRACT(DOW FROM e.created_at) IN (0, 6) THEN 10 ELSE 0 END +
        CASE WHEN vendor_count < 2 THEN 15 ELSE 0 END +
        CASE WHEN e.amount = ROUND(e.amount, 0) THEN 10 ELSE 0 END +
        CASE WHEN avg_confidence < 0.7 THEN 20 ELSE 0 END
      ) as fraud_risk_score
      
    FROM synapse.expenses e
    LEFT JOIN synapse.receipt_metadata rm ON rm.expense_id = e.id
    LEFT JOIN basejump.accounts p ON p.primary_owner_user_id = e.user_id AND p.personal_account = true
    
    -- Calculate user's average expense amount
    LEFT JOIN (
      SELECT 
        user_id,
        AVG(amount) as avg_amount
      FROM synapse.expenses e1
      WHERE e1.account_id = detect_fraud_patterns.account_id
        AND e1.created_at >= NOW() - INTERVAL '90 days'
      GROUP BY user_id
    ) user_avg ON user_avg.user_id = e.user_id
    
    -- Calculate expense count in last 24 hours
    LEFT JOIN (
      SELECT 
        user_id,
        COUNT(*) as expense_count_24h
      FROM synapse.expenses e1
      WHERE e1.account_id = detect_fraud_patterns.account_id
        AND e1.created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY user_id
    ) recent_expenses ON recent_expenses.user_id = e.user_id
    
    -- Calculate vendor count for this user
    LEFT JOIN (
      SELECT 
        e2.user_id,
        COUNT(DISTINCT rm2.vendor_name) as vendor_count
      FROM synapse.expenses e2
      LEFT JOIN synapse.receipt_metadata rm2 ON rm2.expense_id = e2.id
      WHERE e2.account_id = detect_fraud_patterns.account_id
        AND e2.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY e2.user_id
    ) vendor_stats ON vendor_stats.user_id = e.user_id
    
    -- Calculate average confidence score
    LEFT JOIN (
      SELECT 
        e3.id as expense_id,
        AVG(rm3.confidence_score) as avg_confidence
      FROM synapse.expenses e3
      LEFT JOIN synapse.receipt_metadata rm3 ON rm3.expense_id = e3.id
      WHERE e3.account_id = detect_fraud_patterns.account_id
      GROUP BY e3.id
    ) confidence_stats ON confidence_stats.expense_id = e.id
    
    WHERE e.account_id = detect_fraud_patterns.account_id
      AND e.created_at >= NOW() - INTERVAL '30 days'
      AND e.status IN ('PENDING', 'ANALYZED')
  )
  SELECT json_agg(
    json_build_object(
      'expense_id', fa.expense_id,
      'account_expense_id', fa.account_expense_id,
      'title', fa.title,
      'amount', fa.amount,
      'status', fa.status,
      'created_at', fa.created_at,
      'user_id', fa.user_id,
      'user_name', fa.user_name,
      'vendor_name', fa.vendor_name,
      'fraud_risk_score', fa.fraud_risk_score,
      'risk_level', 
        CASE 
          WHEN fa.fraud_risk_score >= 60 THEN 'HIGH'
          WHEN fa.fraud_risk_score >= 30 THEN 'MEDIUM'
          ELSE 'LOW'
        END,
      'indicators', json_build_object(
        'amount_anomaly', fa.amount_anomaly,
        'submission_pattern', fa.submission_pattern,
        'timing_anomaly', fa.timing_anomaly,
        'vendor_anomaly', fa.vendor_anomaly,
        'amount_pattern', fa.amount_pattern,
        'receipt_quality', fa.receipt_quality
      ),
      'context', json_build_object(
        'user_avg_amount', fa.avg_amount,
        'expense_count_24h', fa.expense_count_24h,
        'vendor_count', fa.vendor_count,
        'avg_confidence', fa.avg_confidence
      )
    ) ORDER BY fa.fraud_risk_score DESC, fa.created_at DESC
  ) INTO fraud_indicators
  FROM fraud_analysis fa
  WHERE fa.fraud_risk_score > 0;

  RETURN COALESCE(fraud_indicators, '[]'::json);
END;
$$;

-- Function to get fraud detection summary for team dashboard
CREATE OR REPLACE FUNCTION public.get_fraud_detection_summary(account_id uuid)
  RETURNS json
  LANGUAGE plpgsql
  SET search_path = ''
AS $$
DECLARE
  summary json;
BEGIN
  -- Verify the user has owner access to this account
  IF NOT basejump.has_role_on_account(account_id, 'owner') THEN
    RAISE EXCEPTION 'Access denied: only team owners can view fraud detection summary';
  END IF;

  WITH fraud_stats AS (
    SELECT 
      COUNT(*) as total_expenses,
      COUNT(CASE WHEN fraud_risk_score >= 60 THEN 1 END) as high_risk_count,
      COUNT(CASE WHEN fraud_risk_score >= 30 AND fraud_risk_score < 60 THEN 1 END) as medium_risk_count,
      COUNT(CASE WHEN fraud_risk_score > 0 AND fraud_risk_score < 30 THEN 1 END) as low_risk_count,
      AVG(fraud_risk_score) as avg_risk_score,
      MAX(fraud_risk_score) as max_risk_score
    FROM (
      SELECT 
        e.id,
        (
          CASE WHEN e.amount > (avg_amount * 3) THEN 25 ELSE 0 END +
          CASE WHEN expense_count_24h > 5 THEN 20 ELSE 0 END +
          CASE WHEN EXTRACT(DOW FROM e.created_at) IN (0, 6) THEN 10 ELSE 0 END +
          CASE WHEN vendor_count < 2 THEN 15 ELSE 0 END +
          CASE WHEN e.amount = ROUND(e.amount, 0) THEN 10 ELSE 0 END +
          CASE WHEN avg_confidence < 0.7 THEN 20 ELSE 0 END
        ) as fraud_risk_score
      FROM synapse.expenses e
      LEFT JOIN synapse.receipt_metadata rm ON rm.expense_id = e.id
      LEFT JOIN (
        SELECT 
          user_id,
          AVG(amount) as avg_amount
        FROM synapse.expenses e1
        WHERE e1.account_id = get_fraud_detection_summary.account_id
          AND e1.created_at >= NOW() - INTERVAL '90 days'
        GROUP BY user_id
      ) user_avg ON user_avg.user_id = e.user_id
      LEFT JOIN (
        SELECT 
          user_id,
          COUNT(*) as expense_count_24h
        FROM synapse.expenses e1
        WHERE e1.account_id = get_fraud_detection_summary.account_id
          AND e1.created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY user_id
      ) recent_expenses ON recent_expenses.user_id = e.user_id
      LEFT JOIN (
        SELECT 
          e2.user_id,
          COUNT(DISTINCT rm2.vendor_name) as vendor_count
        FROM synapse.expenses e2
        LEFT JOIN synapse.receipt_metadata rm2 ON rm2.expense_id = e2.id
        WHERE e2.account_id = get_fraud_detection_summary.account_id
          AND e2.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY e2.user_id
      ) vendor_stats ON vendor_stats.user_id = e.user_id
      LEFT JOIN (
        SELECT 
          e3.id as expense_id,
          AVG(rm3.confidence_score) as avg_confidence
        FROM synapse.expenses e3
        LEFT JOIN synapse.receipt_metadata rm3 ON rm3.expense_id = e3.id
        WHERE e3.account_id = get_fraud_detection_summary.account_id
        GROUP BY e3.id
      ) confidence_stats ON confidence_stats.expense_id = e.id
      WHERE e.account_id = get_fraud_detection_summary.account_id
        AND e.created_at >= NOW() - INTERVAL '30 days'
        AND e.status IN ('PENDING', 'ANALYZED')
    ) risk_scores
  )
  SELECT json_build_object(
    'total_expenses', fs.total_expenses,
    'high_risk_count', fs.high_risk_count,
    'medium_risk_count', fs.medium_risk_count,
    'low_risk_count', fs.low_risk_count,
    'avg_risk_score', ROUND(fs.avg_risk_score::numeric, 1),
    'max_risk_score', fs.max_risk_score,
    'risk_percentage', 
      CASE 
        WHEN fs.total_expenses > 0 
        THEN ROUND(((fs.high_risk_count + fs.medium_risk_count)::numeric / fs.total_expenses * 100)::numeric, 1)
        ELSE 0
      END
  ) INTO summary
  FROM fraud_stats fs;

  RETURN summary;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.detect_fraud_patterns(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_fraud_detection_summary(uuid) TO authenticated; 