import type { SupabaseClient } from "@supabase/supabase-js";

import { runReceiptAnalysis } from "./receipt-analyze";

export async function processReceiptsForExpense(
  supabase: SupabaseClient,
  expenseId: string
): Promise<void> {
  console.log(`Starting receipt processing for expense: ${expenseId}`);

  // Use the RPC function to get receipts that need processing
  const { data: receiptsData, error: rpcError } = await supabase.rpc("get_receipts_to_process", {
    expense_id: expenseId,
  });

  if (rpcError != null) {
    console.error("Failed to get receipts to process", rpcError);
    throw new Error("Failed to get receipts to process");
  }

  if (receiptsData == null || receiptsData.length === 0) {
    console.log("No receipts found that need processing");
    return;
  }

  console.log(`Found ${receiptsData.length} receipts that need processing`);

  // Process receipts with AI analysis and prepare data for RPC
  const analysesData = await Promise.all(
    receiptsData.map((receipt: { name: string; id: string }) =>
      runReceiptAnalysis(supabase, receipt.id, receipt.name)
    )
  );

  // Store processed receipts using the new RPC function
  const { error: storageError } = await supabase.rpc("store_receipt_analyses", {
    expense_id: expenseId,
    analyses_data: analysesData,
  });

  if (storageError != null) {
    console.error("Failed to store receipt analyses", storageError);
    throw new Error("Failed to store receipt analyses");
  }

  console.log(`Stored ${analysesData.length} receipt analyses successfully`);

  console.log(`Receipt processing complete for expense ${expenseId}`);
}
