export interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency_code: string;
  status: "NEW" | "PENDING" | "APPROVED" | "REJECTED" | "ANALYZED";
  submitted_by: {
    id: string;
    name: string;
    email: string;
  };
  approved_by?: {
    id: string;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ReceiptLineItem {
  id: string;
  expense_id: string;
  receipt_name: string;
  description: string;
  quantity?: number;
  unit_price?: number;
  total_amount: number;
  category?: string;
  is_ai_generated: boolean;
  is_deleted?: boolean;
  created_at: string;
}

export interface ReceiptMetadata {
  id: string;
  expense_id: string;
  receipt_name: string;
  vendor_name: string;
  receipt_date: string;
  receipt_total?: number;
  tax_amount?: number;
  confidence_score: number;
  currency_code: string;
  created_at: string;
}

export interface ExpenseDetails {
  id: string;
  user_id: string;
  title: string;
  description: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  receipt_metadata: ReceiptMetadata[];
  receipt_line_items: ReceiptLineItem[];
  receipts: string[];
  currency_code: string;
}
