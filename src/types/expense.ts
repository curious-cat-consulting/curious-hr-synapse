export interface Expense {
  id: string;
  account_expense_id: number;
  title: string;
  description: string;
  amount: number;
  currency_code: string;
  status: "NEW" | "PENDING" | "APPROVED" | "REJECTED" | "ANALYZED";
  created_at: string;
  updated_at: string;
  user_id: string;
  account_id: string;
  account_name: string;
  account_personal: boolean;
  receipt_metadata: ReceiptMetadata[];
  receipt_line_items: ReceiptLineItem[];
  mileage_line_items: MileageLineItem[];
  unprocessed_receipts: UnprocessedReceipt[];
}

export interface TeamExpense
  extends Omit<
    Expense,
    | "receipt_metadata"
    | "receipt_line_items"
    | "mileage_line_items"
    | "unprocessed_receipts"
    | "updated_at"
    | "currency_code"
  > {
  user_id: string;
  user_name: string;
}

export interface ReceiptLineItem {
  id: string;
  receipt_id: string;
  description: string;
  quantity?: number;
  unit_price?: number;
  total_amount: number;
  category?: string;
  is_ai_generated: boolean;
  is_deleted?: boolean;
  line_item_date?: string;
  created_at: string;
  _type: "regular";
}

export interface MileageLineItem {
  id: string;
  from_address: string;
  to_address: string;
  category?: string;
  miles_driven: number;
  calculated_miles?: number;
  custom_miles?: number;
  total_amount: number;
  line_item_date?: string;
  created_at: string;
  is_deleted?: boolean;
  _type: "miles";
}

export type LineItem = ReceiptLineItem | MileageLineItem;

export interface ReceiptMetadata {
  id: string;
  expense_id: string;
  receipt_id: string;
  vendor_name: string;
  receipt_date: string;
  receipt_total?: number;
  tax_amount?: number;
  confidence_score: number;
  currency_code: string;
  created_at: string;
}

export interface UnprocessedReceipt {
  id: string;
  name: string;
  path: string;
  created_at: string;
}
