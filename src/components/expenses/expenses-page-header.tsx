"use client";

import { NewExpenseDrawer } from "@components/expenses/new-expense-drawer";

interface ExpensesPageHeaderProps {
  fraudFilter?: string;
  accountId?: string;
  accountName?: string;
  onExpenseCreated?: (expenseId: string) => void;
}

export function ExpensesPageHeader({
  fraudFilter,
  accountId,
  accountName,
  onExpenseCreated,
}: ExpensesPageHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-bold">
        {fraudFilter === "high" ? "Fraud Flagged Expenses" : "Team Expenses"}
      </h1>
      <div data-testid="expenses-page-new-expense">
        <NewExpenseDrawer
          onExpenseCreated={onExpenseCreated}
          accountId={accountId}
          accountName={accountName}
        />
      </div>
    </div>
  );
}
