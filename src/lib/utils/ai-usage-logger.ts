import { createClient } from "@supabase/supabase-js";

import type { AIUsageLogParams, AIOperationType } from "../../types/ai-usage";

/**
 * Logs AI usage to the database for tracking and metrics.
 * This function should be called after each AI operation.
 */
export async function logAIUsage(params: AIUsageLogParams): Promise<string | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.rpc("log_ai_usage", {
      p_expense_id: params.expense_id,
      p_model: params.model,
      p_operation_type: params.operation_type,
      p_prompt_tokens: params.prompt_tokens ?? null,
      p_completion_tokens: params.completion_tokens ?? null,
      p_total_tokens: params.total_tokens ?? null,
      p_request_data: params.request_data ?? null,
      p_response_data: params.response_data ?? null,
      p_success: params.success ?? true,
      p_error_message: params.error_message ?? null,
      p_processing_time_ms: params.processing_time_ms ?? null,
    });

    if (error != null) {
      console.error("Failed to log AI usage:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error logging AI usage:", error);
    return null;
  }
}

/**
 * Wrapper function to log AI usage with timing.
 * Automatically measures processing time and logs the result.
 */
export async function logAIUsageWithTiming<T>(
  operation: () => Promise<T>,
  params: Omit<AIUsageLogParams, "processing_time_ms" | "success" | "error_message">,
  extractData?: (result: T) => {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    response_data?: Record<string, any>;
  }
): Promise<T> {
  const startTime = Date.now();
  let errorMessage: string | null = null;

  try {
    const result = await operation();

    // Extract additional data from the result if callback provided
    const extractedData = extractData?.(result) ?? {};

    // Log successful operation
    await logAIUsage({
      ...params,
      prompt_tokens: extractedData.prompt_tokens ?? params.prompt_tokens,
      completion_tokens: extractedData.completion_tokens ?? params.completion_tokens,
      total_tokens: extractedData.total_tokens ?? params.total_tokens,
      response_data: extractedData.response_data ?? params.response_data,
      success: true,
      processing_time_ms: Date.now() - startTime,
    });

    return result;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    // Log failed operation
    await logAIUsage({
      ...params,
      success: false,
      error_message: errorMessage,
      processing_time_ms: Date.now() - startTime,
    });

    throw error;
  }
}

/**
 * Helper function to create AI operations with automatic token tracking.
 * This makes it easy to add new AI operations that use OpenAI.
 */
export function createAIOperation<T, R>(
  operation: (input: T) => Promise<R>,
  config: {
    model: string;
    operation_type: AIOperationType;
    extractTokens?: (result: R) => {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
    extractResponseData?: (result: R) => Record<string, any>;
    extractRequestData?: (input: T) => Record<string, any>;
  }
) {
  return async (input: T, expenseId: string): Promise<R> => {
    return logAIUsageWithTiming(
      async () => {
        return await operation(input);
      },
      {
        expense_id: expenseId,
        model: config.model,
        operation_type: config.operation_type,
        request_data: config.extractRequestData?.(input) ?? {},
        response_data: {},
      },
      (result) => {
        const tokenData = config.extractTokens?.(result) ?? {};
        const responseData = config.extractResponseData?.(result) ?? {};

        return {
          prompt_tokens: tokenData.prompt_tokens,
          completion_tokens: tokenData.completion_tokens,
          total_tokens: tokenData.total_tokens,
          response_data: responseData,
        };
      }
    );
  };
}
