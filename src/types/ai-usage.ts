export interface AIUsageLog {
  id: string;
  user_id: string;
  account_id: string;
  model: string;
  operation_type: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  request_data?: Record<string, any>;
  response_data?: Record<string, any>;
  success: boolean;
  error_message?: string;
  processing_time_ms?: number;
  created_at: string;
  updated_at: string;
}

export interface AIUsageStats {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  success_rate: number;
  total_tokens: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  average_processing_time_ms: number;
  models_used: string[];
  operations: string[];
  usage_by_model: Record<string, number>;
  usage_by_operation: Record<string, number>;
  daily_usage: Array<{
    date: string;
    requests: number;
    tokens: number;
    success_rate: number;
  }>;
}

export type AIOperationType =
  | "receipt_analysis"
  | "fraud_detection"
  | "duplicate_detection"
  | "expense_categorization"
  | "vendor_analysis";

export interface AIUsageLogParams {
  expense_id: string;
  model: string;
  operation_type: AIOperationType;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  request_data?: Record<string, any>;
  response_data?: Record<string, any>;
  success?: boolean;
  error_message?: string;
  processing_time_ms?: number;
}
