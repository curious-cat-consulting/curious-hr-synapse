import { cache } from "react";

import { createClient } from "../supabase/server";

/**
 * Server-side function to get fraud detection data with React cache
 */
export const getFraudDetectionData = cache(async (accountId: string) => {
  const supabaseClient = createClient();

  // Fetch fraud patterns
  const { data: fraudData, error: fraudError } = await supabaseClient.rpc("detect_fraud_patterns", {
    account_id: accountId,
  });

  if (fraudError != null) {
    throw new Error(fraudError.message);
  }

  // Fetch fraud summary
  const { data: summaryData, error: summaryError } = await supabaseClient.rpc(
    "get_fraud_detection_summary",
    {
      account_id: accountId,
    }
  );

  if (summaryError != null) {
    throw new Error(summaryError.message);
  }

  return {
    fraudIndicators: fraudData ?? [],
    summary: summaryData,
  };
});

/**
 * Server-side function to get fraud detection summary only
 */
export const getFraudDetectionSummary = cache(async (accountId: string) => {
  const supabaseClient = createClient();

  const { data: summaryData, error: summaryError } = await supabaseClient.rpc(
    "get_fraud_detection_summary",
    {
      account_id: accountId,
    }
  );

  if (summaryError != null) {
    throw new Error(summaryError.message);
  }

  return summaryData;
});
