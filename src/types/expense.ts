export interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency_code: string;
  status: "NEW" | "PENDING" | "APPROVED" | "REJECTED" | "ANALYZED";
  created_at: string;
  updated_at: string;
}
