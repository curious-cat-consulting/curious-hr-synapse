import type { SupabaseClient } from "@supabase/supabase-js";

import type { ReceiptAnalysis } from "./openai";
import { analyzeReceipt } from "./openai";

export interface ProcessedReceipt {
  receiptId: string;
  analysis: ReceiptAnalysis;
}

export async function runReceiptAnalysis(
  supabase: SupabaseClient,
  receiptId: string,
  receiptName: string,
  expenseId: string
): Promise<ProcessedReceipt> {
  console.log(`Processing receipt: ${receiptName}`);

  // Get the receipt file from storage
  const { data: receiptData, error: receiptError } = await supabase.storage
    .from("receipts")
    .download(receiptName);

  if (receiptError != null) {
    console.error(`Failed to fetch receipt ${receiptName}`, receiptError);
    throw new Error(`Failed to fetch receipt ${receiptName}`);
  }

  // Convert the receipt to base64
  const buffer = await receiptData.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  console.log(`Analyzing receipt ${receiptName} with OpenAI`);

  // Analyze receipt using OpenAI
  const analysis = await analyzeReceipt(base64, expenseId);

  console.log(`Analysis complete for ${receiptName}`);

  return {
    receiptId,
    analysis,
  };
}
