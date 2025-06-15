export interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
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