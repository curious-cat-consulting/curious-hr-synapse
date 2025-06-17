import type { SupabaseClient } from "@supabase/supabase-js";

import type { ProcessedReceipt } from "./ReceiptAnalysisService";

// Database types based on schema
interface ReceiptMetadataInsert {
  expense_id: string;
  receipt_name: string;
  vendor_name: string;
  receipt_date: string;
  receipt_total: number;
  tax_amount?: number;
  confidence_score: number;
  currency: string;
}

interface ReceiptMetadataRow {
  id: string;
  expense_id: string;
  receipt_name: string;
  vendor_name: string;
  receipt_date: string;
  receipt_total: number | null;
  tax_amount: number | null;
  confidence_score: number;
  currency_code: string;
  created_at: string;
}

interface ReceiptLineItemInsert {
  expense_id: string;
  receipt_name: string;
  description: string;
  quantity?: number;
  unit_price?: number;
  total_amount: number;
  category?: string;
  is_ai_generated: boolean;
}

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

export class ReceiptStorageService {
  constructor(private readonly supabase: SupabaseClient) {}

  async storeReceiptMetadata(
    expenseId: string,
    receipt: StorageFileObject,
    analysis: ReceiptAnalysis
  ): Promise<ReceiptMetadataRow> {
    console.log(`Storing metadata for receipt: ${receipt.name}`);

    const insertData: ReceiptMetadataInsert = {
      expense_id: expenseId,
      receipt_name: receipt.name,
      vendor_name: analysis.vendor_name,
      receipt_date: analysis.receipt_date,
      receipt_total: analysis.receipt_total,
      tax_amount: analysis.tax_amount,
      confidence_score: analysis.confidence_score,
      currency: analysis.currency,
    };

    const { data: metadataData, error: metadataError } = await this.supabase
      .from("receipt_metadata")
      .insert(insertData)
      .select()
      .single();

    if (metadataError != null) {
      throw metadataError;
    }

    if (metadataData == null) {
      throw new Error("No data returned from metadata insert");
    }

    return metadataData;
  }

  async storeReceiptLineItems(
    expenseId: string,
    receipt: StorageFileObject,
    analysis: ReceiptAnalysis
  ): Promise<ReceiptLineItemInsert[]> {
    console.log(`Storing line items for receipt: ${receipt.name}`);

    const lineItems: ReceiptLineItemInsert[] = analysis.line_items.map((item) => ({
      expense_id: expenseId,
      receipt_name: receipt.name,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_amount: item.total_amount,
      category: item.category,
      is_ai_generated: true,
    }));

    const { error: lineItemsError } = await this.supabase
      .from("receipt_line_items")
      .insert(lineItems);

    if (lineItemsError != null) {
      throw lineItemsError;
    }

    console.log(`Stored ${lineItems.length} line items for ${receipt.name}`);
    return lineItems;
  }

  async storeProcessedReceipt(
    expenseId: string,
    processedReceipt: ProcessedReceipt
  ): Promise<{
    receipt: StorageFileObject;
    analysis: ReceiptAnalysis;
    metadata: ReceiptMetadataRow;
    lineItems: ReceiptLineItemInsert[];
  }> {
    const { receipt, analysis } = processedReceipt;

    // Store metadata
    const metadata = await this.storeReceiptMetadata(expenseId, receipt, analysis);

    // Store line items
    const lineItems = await this.storeReceiptLineItems(expenseId, receipt, analysis);

    return {
      receipt,
      analysis,
      metadata,
      lineItems,
    };
  }

  async storeMultipleProcessedReceipts(
    expenseId: string,
    processedReceipts: ProcessedReceipt[]
  ): Promise<
    {
      receipt: StorageFileObject;
      analysis: ReceiptAnalysis;
      metadata: ReceiptMetadataRow;
      lineItems: ReceiptLineItemInsert[];
    }[]
  > {
    const storagePromises = processedReceipts.map((processedReceipt) =>
      this.storeProcessedReceipt(expenseId, processedReceipt)
    );

    return Promise.all(storagePromises);
  }
}
