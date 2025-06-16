import type { SupabaseClient } from "@supabase/supabase-js";

import { analyzeReceipt } from "@lib/openai";

// Import the ReceiptAnalysis type from openai lib
interface ReceiptAnalysis {
  vendor_name: string;
  vendor_address?: string;
  receipt_date: string;
  receipt_total: number;
  tax_amount?: number;
  currency: string;
  line_items: {
    description: string;
    quantity?: number;
    unit_price?: number;
    total_amount: number;
    category?: string;
    date?: string;
  }[];
  confidence_score: number;
}

interface StorageFileObject {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: Record<string, unknown>;
}

export interface ProcessedReceipt {
  receipt: StorageFileObject;
  analysis: ReceiptAnalysis;
  metadata: null;
  lineItems: never[];
}

export class ReceiptAnalysisService {
  constructor(private readonly supabase: SupabaseClient) {}

  async getReceiptsToProcess(userId: string, expenseId: string): Promise<StorageFileObject[]> {
    // List all receipts in the expense's directory
    const { data: receipts, error: listError } = await this.supabase.storage
      .from("receipts")
      .list(`${userId}/${expenseId}`);

    if (listError != null) {
      console.error("Failed to list receipts", listError);
      throw new Error("Failed to list receipts");
    }

    if (receipts.length === 0) {
      console.log("No receipts found in storage");
      return [];
    }

    console.log(`Found ${receipts.length} receipts in storage`);

    // Get existing receipt metadata to check which receipts have been analyzed
    const { data: existingMetadata, error: metadataError } = await this.supabase
      .from("receipt_metadata")
      .select("id, receipt_name")
      .eq("expense_id", expenseId);

    if (metadataError != null) {
      console.error("Failed to fetch existing receipt metadata", metadataError);
      throw new Error("Failed to fetch existing receipt metadata");
    }

    // Create a set of already analyzed receipt names
    const analyzedReceipts = new Set(existingMetadata.map((meta) => meta.receipt_name));

    // Filter out receipts that have already been analyzed
    const receiptsToProcess = receipts.filter((receipt) => !analyzedReceipts.has(receipt.name));

    console.log(
      `${receiptsToProcess.length} receipts need processing (${analyzedReceipts.size} already analyzed)`
    );

    return receiptsToProcess;
  }

  async processReceipt(
    userId: string,
    expenseId: string,
    receipt: StorageFileObject
  ): Promise<ProcessedReceipt> {
    console.log(`Processing receipt: ${receipt.name}`);

    // Get the receipt file from storage
    const { data: receiptData, error: receiptError } = await this.supabase.storage
      .from("receipts")
      .download(`${userId}/${expenseId}/${receipt.name}`);

    if (receiptError != null) {
      throw new Error(`Failed to fetch receipt ${receipt.name}`);
    }

    // Convert the receipt to base64
    const buffer = await receiptData.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    console.log(`Analyzing receipt ${receipt.name} with OpenAI`);

    // Analyze receipt using OpenAI
    const analysis = await analyzeReceipt(base64);

    console.log(
      `Analysis complete for ${receipt.name} - vendor: ${analysis.vendor_name}, total: ${analysis.receipt_total}`
    );

    return {
      receipt,
      analysis,
      metadata: null, // Will be set by storage service
      lineItems: [], // Will be set by storage service
    };
  }

  async processMultipleReceipts(
    userId: string,
    expenseId: string,
    receipts: StorageFileObject[]
  ): Promise<ProcessedReceipt[]> {
    const receiptPromises = receipts.map((receipt) =>
      this.processReceipt(userId, expenseId, receipt)
    );

    return Promise.all(receiptPromises);
  }
}
