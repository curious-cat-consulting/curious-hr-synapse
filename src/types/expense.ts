export interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency_code: string;
  status: "NEW" | "PENDING" | "APPROVED" | "REJECTED" | "ANALYZED";
  created_at: string;
  updated_at: string;
  receipt_line_items: ReceiptLineItem[];
  mileage_line_items: MileageLineItem[];
}

export interface ReceiptLineItem {
  id: string;
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
