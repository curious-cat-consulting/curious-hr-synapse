export type Expense = {
  id: string;
  status: "NEW" | "PENDING" | "ANALYZED" | "APPROVED" | "REJECTED";
};
