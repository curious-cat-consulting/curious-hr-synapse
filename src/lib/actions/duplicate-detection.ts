import { cache } from "react";

import { createClient } from "../supabase/server";

/**
 * Server-side function to get duplicate detection data with React cache
 */
export const getDuplicateDetectionData = cache(async (expenseId: string) => {
  const supabaseClient = createClient();

  const { data: duplicateData, error } = await supabaseClient.rpc("detect_receipt_duplicates", {
    expense_id: expenseId,
  });

  if (error != null) {
    throw new Error(error.message);
  }

  return duplicateData ?? [];
});
